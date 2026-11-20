# Deployment Multi-Instance (Primary + Demo + Test + Trial)

Dokumen ini menjelaskan cara kerja empat instance dari satu source tree, cara bootstrap instance baru, dan checklist rilis.

## Matriks instance

| Item | Primary | Demo | Test | Trial |
|---|---|---|---|---|
| Worker name | `icofr` | `icofr-demo` | `icofr-test` | `icofr-trial` |
| Host | `https://icofr.tech1solusi.workers.dev` | `https://icofr-demo.tech1solusi.workers.dev` | `https://icofr-test.tech1solusi.workers.dev` | `https://icofr-trial.tech1solusi.workers.dev` |
| Wrangler config | `wrangler.jsonc` | `wrangler.demo.jsonc` | `wrangler.test.jsonc` | `wrangler.trial.jsonc` |
| Build artifact | `dist/icofr/wrangler.json` | `dist/icofr_demo/wrangler.json` | `dist/icofr_test/wrangler.json` | `dist/icofr_trial/wrangler.json` |
| Build / deploy | `build` / `deploy` | `build:demo` / `deploy:demo` | `build:test` / `deploy:test` | `build:trial` / `deploy:trial` |
| R2 bucket | `icofr-documents` | `icofr-documents-demo` | `icofr-documents-test` | `icofr-documents-trial` |
| Database variable di `.env` | `DATABASE_URL` | `DEMO_DATABASE_URL` | `TEST_DATABASE_URL` | `TRIAL_DATABASE_URL` |
| `SOURCE_DATABASE_URL` | — | primary | primary | primary |
| `BETTER_AUTH_SECRET` | milik primary | **wajib baru**, terpisah | **wajib baru**, terpisah | **wajib baru**, terpisah |
| `BETTER_AUTH_URL` | secret Worker (dashboard), bukan var di `wrangler.jsonc` | var di `wrangler.demo.jsonc` | var di `wrangler.test.jsonc` | var di `wrangler.trial.jsonc` |
| `ENV` | belum di-set | `production` | `production` | `production` |
| `SKIP_LICENSE` | `true` | `true` | `true` | `true` |

Data tidak pernah dibagi: database, bucket, dan secret sesi terpisah. Setelah clone identitas awal, tidak ada sinkronisasi data antar instance. `.env` hanya dibaca script lokal (clone, Drizzle, extension, dev); Worker memakai secret miliknya sendiri di Cloudflare.

`BETTER_AUTH_URL` adalah satu-satunya origin auth yang dipercaya instance tersebut (`worker/lib/trusted-origins.ts`). Origin primary hanya dipakai sebagai fallback bila `BETTER_AUTH_URL` sama sekali belum di-set (local dev). Untuk custom domain tambahan, isi secret `TRUSTED_ORIGINS` (dipisah koma) — jangan pernah menambahkan origin instance lain. (Allowlist CORS `/api/*` terpisah dan tidak memengaruhi cookie sesi; SPA berjalan same-origin.)

## Bootstrap instance baru (dari database kosong)

Jalankan dari root repo. Contoh di bawah memakai instance `TEST_DATABASE_URL`; ganti nama variabelnya untuk instance lain. `SOURCE_DATABASE_URL` harus menunjuk primary.

Semua perintah DDL memakai **direct/unpooled** URL: buang `-pooler` dari host. Jangan pernah menempelkan URL ke argumen perintah atau history shell; muat dari `.env` ke process environment untuk perintah itu saja.

```powershell
# 1. Pilih instance dan muat URL-nya tanpa mencetak nilainya.
$instance = 'TEST_DATABASE_URL'
$env:DATABASE_URL = (Get-Content .env |
  Where-Object { $_ -match "^$instance=" } |
  ForEach-Object { ($_ -split '=', 2)[1].Trim().Trim('"') })
$env:DATABASE_URL = $env:DATABASE_URL -replace '-pooler', ''

# 2. Ekstensi + pin search_path. Script mencetak host target — cocokkan dengan
#    endpoint instance di Neon, lalu batalkan jika yang muncul host lain.
npm run db:extensions

# 3. Schema ke schema `icofr` (lihat catatan di bawah soal migrate).
npx drizzle-kit push --force

# 4. Gate drift + ekstensi terhadap database target.
npm run db:check

# 5. Hapus override sebelum langkah berikutnya.
Remove-Item Env:DATABASE_URL

# 6. Salin identitas (dry-run dulu, lalu --apply).
#    Kedua mode menolak target yang sudah berisi konten.
npm run clone:identity -- --target-env TEST_DATABASE_URL
npm run clone:identity -- --target-env TEST_DATABASE_URL --apply

# 7. Bucket object storage (jurisdiction sama dengan demo).
npx wrangler r2 bucket create icofr-documents-test

# 8. Deploy Worker.
npm run deploy:test

# 9. Secrets (dashboard atau CLI, setelah Worker ada).
npx wrangler secret put DATABASE_URL --name icofr-test        # pooled target
npx wrangler secret put BETTER_AUTH_SECRET --name icofr-test   # nilai baru, 32 byte acak
npx wrangler secret put GEMINI_API_KEY --name icofr-test
```

`db:extensions` juga menjalankan `ALTER ROLE CURRENT_USER SET search_path TO icofr, public`. Ini wajib: `worker/db/index.ts` membuka `postgres(dbUrl)` tanpa search path, sedangkan database Neon baru default ke `"$user", public`. Tanpa langkah ini Worker bisa deploy tetapi setiap query gagal. Verifikasi dengan koneksi **baru**:

```powershell
node -e "require('dotenv').config(); const p=require('postgres'); const s=p(process.env.TEST_DATABASE_URL); s.unsafe('SHOW search_path').then(r=>{console.log(r[0].search_path); return s.end();})"
```

Harus mencetak `icofr, public`. Primary dan demo sudah memakai nilai yang sama.

Koneksi pooler yang sudah terbuka **sebelum** `ALTER ROLE` dapat mempertahankan `search_path` lama (`"$user", public`) karena backend-nya dipakai ulang. Jika verifikasi pooled masih menampilkan nilai lama, tutup/recycle backend pooler (atau tunggu idle timeout) lalu ulangi sampai `icofr, public`; Worker memakai URL pooled, jadi verifikasi ini bagian dari bootstrap.

### Clone identitas: target eksplisit, gagal sebelum menulis

`clone:identity` tidak punya target default. Flag `--target-env <NAMA_VARIABEL>` membaca variabel itu **setelah dotenv memuat `.env`**; variabel shell yang diekspor tidak otomatis masuk ke `.env`. Script mencetak host source dan target (tanpa kredensial), lalu:

- menolak jika target punya baris di tabel konten mana pun — sebelum satu baris identitas ditulis;
- menolak `--apply` bila source dan target resolve ke database yang sama;
- memverifikasi jumlah identitas dan hash kredensial dengan membaca **kedua** database, dan gagal tertutup bila tidak ada baris yang bisa dibandingkan;
- menghitung seluruh tabel konten dari `pg_tables` (bukan daftar hardcode), sehingga tabel baru ikut terperiksa. Tabel operasional (`session`, `verification`, `notifications`, `audit_logs`, `ai_cache_entries`, `system_licenses`) dikecualikan.

### Kenapa `drizzle-kit push`, bukan `drizzle-kit migrate`

Rantai migrasi versioned **tidak bisa diputar ulang di database kosong**:

- `drizzle/0051_ai-cache-entries.sql` menulis ke schema `"icofr"` dan mereferensikan `"icofr"."organization"`.
- Migrasi `0000`–`0050` membuat objek di schema `public`.
- Perpindahan `public` → `icofr` di database primary dilakukan manual (`scripts/migrate-schema-to-icofr.ts`), dan `drizzle.__drizzle_migrations` di primary berisi 0 baris.

Karena itu schema instance baru dibuat dengan `drizzle-kit push` (`schemaFilter: ["icofr"]`, `pgSchema("icofr")`), yang menghasilkan 50 tabel di schema `icofr`, enum `owner_acceptance` di `icofr`, dan tidak ada tabel aplikasi di `public`. Keputusan dan utang rantai migrasi dicatat di `docs/adr/0009-schema-sync-push-and-fresh-db-bootstrap.md` dan diperbaiki sebagai perubahan terpisah.

## Auto-deploy dari `main`

> **PENTING (Dashboard-Only):** Cloudflare Workers Builds (koneksi Git) adalah konfigurasi **Dashboard-Only**. Cloudflare tidak menyediakan perintah CLI `wrangler` untuk mengikat webhook GitHub ke Worker. Pendaftaran wajib dilakukan sekali per Worker lewat Cloudflare Dashboard.

Keempat instance deploy dari branch `main`:

1. Cloudflare Dashboard → Worker `icofr-trial` (dan instance lainnya) → Settings → Build → Connect to Git.
2. Repository root, production branch `main`.
3. Build command: `npm run build`
4. Deploy command: `npx wrangler deploy -c dist/icofr_trial/wrangler.json` (atau sesuai instance masing-masing)
5. Build environment variable: `WRANGLER_CONFIG=wrangler.trial.jsonc`
6. Preview deployments: **off**.

Deploy command sengaja menunjuk artifact eksplisit. `.wrangler/deploy/config.json` selalu ditimpa build terakhir; mengandalkannya membuat `wrangler deploy` polos bisa menimpa Worker yang salah setelah build target lain.

Auto-deploy ini adalah konfigurasi dashboard (bukan file di repo). Status terverifikasi hanya setelah push berikutnya ke `main` benar-benar memicu build/deploy ketiga Worker; sampai itu terjadi, deploy manual adalah jalur yang digunakan.

### Verifikasi tanpa dashboard

```powershell
npx wrangler deployments list --name icofr
npx wrangler deployments list --name icofr-demo
npx wrangler deployments list --name icofr-test
npx wrangler secret list --name icofr-test
npx wrangler r2 bucket list
curl.exe -4 -i https://icofr-test.tech1solusi.workers.dev/api/health
```

`wrangler` tidak bisa membaca setelan Workers Builds (connect-to-git, build command/env, previews) — setelan itu hanya bisa dikonfirmasi manusia di dashboard, dan bukti auto-deploy adalah timestamp deployment yang berubah setelah push ke `main`. Secret hanya bisa diverifikasi keberadaannya (nama), bukan nilainya.

## Checklist rilis (schema + deploy)

Deploy hanya mengirim kode; schema tidak pernah berubah otomatis.

1. Merge ke `main` (memicu build/deploy ketiga Worker).
2. Jika `worker/db/schema/**` berubah: jalankan `npx drizzle-kit push --force` ke **ketiga** database memakai direct URL masing-masing (lihat urutan aman di atas).
3. Jalankan `npm run db:check` terhadap setiap database target.
4. Smoke test ketiga host: `GET /` = 200, `GET /api/health` = 200, login, dan satu endpoint data.
5. Instance yang databasenya belum di-push dianggap **out of date** walau deploy-nya sukses.

## Rollback

- Per Worker: `npx wrangler rollback -c dist/icofr_test/wrangler.json` (test/demo) atau versi primary lewat dashboard/CLI.
- Database dan bucket demo/test bersifat disposable dan tidak direferensikan instance lain. Menghapus Worker test tidak menyentuh data primary/demo.

## Aturan sinkronisasi config

`wrangler.demo.jsonc` dan `wrangler.test.jsonc` menduplikasi `main`, `compatibility_date`, `compatibility_flags`, `assets`, `observability`, `durable_objects`, dan `migrations` dari `wrangler.jsonc`. Invariant ini **dikunci test** `scripts/__tests__/deployment-config.test.ts`:

- test memindai seluruh `wrangler*.jsonc` dan gagal bila ada config yang belum terdaftar di tabel;
- key bersama harus identik dengan primary;
- nama Worker, bucket R2, dan `BETTER_AUTH_URL` harus unik per instance;
- `vars` hanya boleh berisi `ENV`, `SKIP_LICENSE`, `BETTER_AUTH_URL`, dan tidak boleh memuat nama secret;
- path artifact di script deploy harus diturunkan dari nama Worker masing-masing.

Menambah instance keempat berarti menambah satu baris tabel + config + script; tanpa itu test gagal, bukan diam-diam menimpa Worker lain.
