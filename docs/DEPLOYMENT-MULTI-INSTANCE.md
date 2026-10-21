# Deployment Multi-Instance (Primary + Demo)

Dokumen ini menjelaskan cara kerja dua instance dari satu source tree, cara bootstrap instance baru, dan checklist rilis.

## Matriks instance

| Item | Primary | Demo |
|---|---|---|
| Worker name | `icofr` | `icofr-demo` |
| Host | `https://icofr.tech1solusi.workers.dev` | `https://icofr-demo.tech1solusi.workers.dev` |
| Wrangler config | `wrangler.jsonc` | `wrangler.demo.jsonc` |
| Build artifact | `dist/icofr/wrangler.json` | `dist/icofr_demo/wrangler.json` (plugin menormalkan nama folder ke underscore) |
| R2 bucket | `icofr-documents` | `icofr-documents-demo` |
| Database | Neon project A (`DATABASE_URL`) | Neon project B (`TARGET_DATABASE_URL`) |
| `BETTER_AUTH_SECRET` | milik A | **wajib baru**, terpisah |
| `BETTER_AUTH_URL` | **secret Worker** (dashboard), bukan var di `wrangler.jsonc` | var di `wrangler.demo.jsonc` |
| `ENV` | belum di-set | `production` (gate `/api/dev/*` aktif) |
| `SKIP_LICENSE` | `true` | `true` |

Data tidak pernah dibagi: database, bucket, dan secret sesi terpisah. Setelah clone identitas awal, tidak ada sinkronisasi data antar instance.

`BETTER_AUTH_URL` adalah satu-satunya origin auth yang dipercaya instance tersebut (`worker/lib/trusted-origins.ts`). Origin primary hanya dipakai sebagai fallback bila `BETTER_AUTH_URL` sama sekali belum di-set (local dev). Untuk custom domain tambahan, isi secret `TRUSTED_ORIGINS` (dipisah koma) — jangan pernah menambahkan origin instance lain. (Allowlist CORS `/api/*` terpisah dan tidak memengaruhi cookie sesi; SPA berjalan same-origin.)

## Bootstrap instance demo (dari database kosong)

Jalankan dari root repo. Nilai `TARGET_DATABASE_URL` (pooled, `...-pooler...`) dan `SOURCE_DATABASE_URL`/`DATABASE_URL` sudah ada di `.env`.

Semua perintah DDL memakai **direct/unpooled** URL: buang `-pooler` dari host.

```powershell
# 1. Ekstensi (vector + pg_trgm)
$env:DATABASE_URL = "<target-direct>"
npm run db:extensions

# 2. Schema ke schema `icofr` (lihat catatan di bawah soal migrate)
npx drizzle-kit push --force

# 3. Gate drift + ekstensi
npm run db:check

# 4. Salin identitas (dry-run dulu, lalu --apply)
npx tsx scripts/clone-identity-to-tenant.ts
npx tsx scripts/clone-identity-to-tenant.ts --apply

# 5. Bucket object storage
npx wrangler r2 bucket create icofr-documents-demo

# 6. Deploy Worker demo
npm run deploy:demo

# 7. Secrets (dashboard atau CLI, setelah Worker ada)
npx wrangler secret put DATABASE_URL -c dist/icofr_demo/wrangler.json        # pooled target
npx wrangler secret put BETTER_AUTH_SECRET -c dist/icofr_demo/wrangler.json   # nilai baru
npx wrangler secret put GEMINI_API_KEY -c dist/icofr_demo/wrangler.json
```

`.env` tidak diubah: `DATABASE_URL` tetap database primary. Script clone membaca `SOURCE_DATABASE_URL` (fallback `DATABASE_URL`) sebagai sumber dan `TARGET_DATABASE_URL` sebagai tujuan, membuka koneksi direct, dan mem-pin `search_path` ke `icofr, public`.

Verifikasi clone bersifat lintas-database dan **fail closed**: jumlah baris identitas dibandingkan per tabel, hash kredensial dibaca dari kedua database (bukan self-join di target), dan seluruh tabel konten di schema `icofr` dihitung otomatis — daftar tabel tidak di-hardcode, jadi tabel konten baru ikut terperiksa. Tabel operasional yang wajar berisi setelah go-live (`session`, `verification`, `notifications`, `audit_logs`, `ai_cache_entries`, `system_licenses`) dikecualikan dari gerbang "harus kosong". `--apply` menolak berjalan bila source dan target menunjuk database yang sama (mode parity hanya boleh tanpa `--apply`), dan konflik email dengan id berbeda digagalkan sebelum menulis.

### Kenapa `drizzle-kit push`, bukan `drizzle-kit migrate`

Rantai migrasi versioned **tidak bisa diputar ulang di database kosong**:

- `drizzle/0051_ai-cache-entries.sql` menulis ke schema `"icofr"` dan mereferensikan `"icofr"."organization"`.
- Migrasi `0000`–`0050` membuat objek di schema `public`.
- Perpindahan `public` → `icofr` di database primary dilakukan manual (`scripts/migrate-schema-to-icofr.ts`), dan `drizzle.__drizzle_migrations` di primary berisi 0 baris.

Karena itu schema instance baru dibuat dengan `drizzle-kit push` (`schemaFilter: ["icofr"]`), yang menghasilkan 50 tabel di schema `icofr`, enum `owner_acceptance` di `icofr`, dan tidak ada tabel di `public`. Keputusan dan utang rantai migrasi dicatat di `docs/adr/0009-schema-sync-push-and-fresh-db-bootstrap.md` dan diperbaiki sebagai perubahan terpisah.

Setelah bootstrap, role database demo juga di-set `search_path = icofr, public` (sama seperti primary) agar SQL tanpa kualifikasi di route/script tetap menemukan tabel aplikasi.

## Auto-deploy dari `main`

Primary dan demo sama-sama deploy dari branch `main`:

1. Cloudflare Dashboard → Worker `icofr-demo` → Settings → Build → Connect to Git.
2. Build command: `npm run build`
3. Deploy command: `npx wrangler deploy -c dist/icofr_demo/wrangler.json`
4. Build environment variable: `WRANGLER_CONFIG=wrangler.demo.jsonc`
5. Preview deployments: **off**.

Deploy command sengaja menunjuk artifact eksplisit. `.wrangler/deploy/config.json` selalu ditimpa build terakhir; mengandalkannya membuat `wrangler deploy` polos bisa menimpa Worker yang salah setelah build target lain.

Auto-deploy ini adalah konfigurasi dashboard (bukan file di repo). Status terverifikasi hanya setelah push berikutnya ke `main` benar-benar memicu build/deploy Worker demo; sampai itu terjadi, deploy manual (`npm run deploy:demo`) adalah jalur yang digunakan.

### Verifikasi tanpa dashboard

```powershell
npx wrangler deployments list --name icofr-demo
npx wrangler secret list --name icofr-demo
npx wrangler r2 bucket list
```

`wrangler` tidak bisa membaca setelan Workers Builds (connect-to-git, build command/env, previews) — setelan itu hanya bisa dikonfirmasi manusia di dashboard, dan bukti auto-deploy adalah timestamp deployment yang berubah setelah push ke `main`. Secret hanya bisa diverifikasi keberadaannya (nama), bukan nilainya.

## Checklist rilis (schema + deploy)

Deploy hanya mengirim kode; schema tidak pernah berubah otomatis.

1. Merge ke `main` (memicu build/deploy kedua Worker).
2. Jika `worker/db/schema/**` berubah: jalankan `npx drizzle-kit push --force` ke **kedua** database (primary dan demo) memakai direct URL masing-masing.
3. Jalankan `npm run db:check` (gate drift snapshot) sebelum atau sesudah push.
4. Smoke test kedua host: `GET /` = 200, login, dan satu endpoint data (mis. `/api/rcm`).
5. Instance yang databasenya belum di-push dianggap **out of date** walau deploy-nya sukses.

## Rollback

- Per Worker: `npx wrangler rollback -c dist/icofr_demo/wrangler.json` (demo) atau versi primary lewat dashboard/CLI.
- Database dan bucket demo bersifat disposable dan tidak direferensikan primary. Menghapus Worker demo tidak menyentuh data primary.

## Aturan sinkronisasi config

`wrangler.demo.jsonc` menduplikasi `main`, `compatibility_date`, `compatibility_flags`, `assets`, `durable_objects`, dan `migrations` dari `wrangler.jsonc`. Invariant ini **dikunci test** `scripts/__tests__/deployment-config.test.ts` (kesamaan key bersama, nama Worker/bucket, `ENV=production`, `BETTER_AUTH_URL`, larangan secret di config, serta path artifact `dist/icofr_demo/wrangler.json` di script deploy). Mengubah `name` Worker demo akan menggagalkan test tersebut, bukan diam-diam menimpa primary. Hanya `name`, bucket R2, dan `vars` per-instance yang boleh berbeda.
