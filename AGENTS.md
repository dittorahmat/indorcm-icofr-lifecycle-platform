# IndoGRC Pro - ICOFR Lifecycle Platform

## Project Overview
IndoGRC Pro is a production-grade web application designed to digitize the ICOFR (Internal Control over Financial Reporting) lifecycle for State-Owned Enterprises (BUMN). It is fully aligned with **Regulation SK-5/DKU.MBU/11/2024**, providing a standardized, transparent, and auditable platform for the mandatory 5-step ICOFR process.

**Key Features:**
*   **BPM Visualization:** Visual business process mapping with standardized legends as per **Lampiran 3** (Oval for Start/End, Hexagon for Risk, Inverted Triangle for Archive, Cylinder for System/Data Media).
*   **Risk Library Cluster:** Industry-specific risk repository for **11 BUMN clusters** (Energy, Food, Finance, Mining, etc.) as per **Lampiran 2**.
*   **Scoping & Materiality:** Automated OM/PM calculation with **Group Multipliers**, proportional allocation, and a dedicated **Equity Investee Monitoring** module (**FAQ No. 5**).
*   **Whistleblowing Recap:** Integration of fraud indicators from WBS into ICOFR risk assessment (**Lampiran 1 Principle 14 & 15**).
*   **Change Management Log:** Regulatory documentation of all modifications with a formal **Change Request & Approval Workflow** (Lini 1 to Lini 2) as per **Lampiran 6**.
*   **Regulatory Reporting:** Automated "Asesmen Manajemen" (Appendix 11) with **Digital Sign-off & Lock**, **QR Code Document Verification**, and automatic effectiveness conclusions.
*   **Governance & Integrity:** Built-in **Auditor Cooling-off Validation** (Bab II) and accountability **KPI Dashboards** for cycle tracking.

## Technology Stack

### Frontend
*   **Framework:** React 18+ (Vite)
*   **Language:** TypeScript
*   **State Management:** TanStack Query, Zustand
*   **Diagramming:** React Flow (BPM Visualization)
*   **Styling:** Tailwind CSS, Shadcn/UI, Framer Motion
*   **Forms:** React Hook Form + Zod

### Backend
*   **Runtime:** Cloudflare Workers / Node.js
*   **Framework:** Hono (Lightweight API routing)
*   **Persistence:** PostgreSQL / Cloudflare Durable Objects
*   **ORM:** Drizzle ORM (PostgreSQL dialect)

## Directory Structure

*   `src/pages/`:
    *   `scoping/`: Materiality, Scoping Matrix, and Haircut Wizard.
    *   `rcm/`: RCM Manager, BPM Editor, Change Log, SOC Monitoring, and App Inventory.
    *   `audit/`: External Assurance Portal (KAP).
    *   `csa/`: Control Self-Assessment workspace with Line 2 validation.
    *   `testing/`: TOD & TOE testing workbench with 6 pilar evaluation.
    *   `deficiencies/`: Kanban board, DoD Wizard, and Aggregate Analysis.
    *   `reports/`: Regulatory reports, WBS recap, and digital sign-off.
*   `shared/`: `types/` per-domain (`common`, `org`, `scoping`, `rcm-bpm`, `csa-testing`, `deficiency`, `user`) + barrel `types.ts` (Source of Truth), `constants/` (data-blob materialitas dkk), compliance utilities.

## Mandat Penyelesaian Tahap & Anti-AI Slop (CRITICAL)

Setiap kali melakukan penambahan komponen, modifikasi antarmuka frontend, menyelesaikan sebuah fitur, perbaikan bug, atau fase pengembangan, Anda **WAJIB** menjalankan urutan validasi berikut tanpa perlu diminta kembali oleh pengguna:

1.  **Mandat Wajib Penggunaan Skill `design-taste-frontend` (Strict Enforcement):**
    *   Setiap kali membuat atau memodifikasi komponen/tampilan antarmuka (`src/**/*.tsx`), Anda **WAJIB** secara eksplisit mengaktifkan dan mematuhi seluruh panduan dari skill `design-taste-frontend`.
    *   **Cakupan pemicu:** mandat ini berlaku ketika JSX/visual berubah (kelas, struktur, teks tampil). Edit logika-only tanpa perubahan visual (import, tipe, deps array, pemindahan fungsi murni) cukup mematuhi substansi checklist tanpa aktivasi skill eksplisit; cantumkan `no visual change` di ringkasan perubahan.
    *   **Anti-AI Slop Checklist (mekanis — ditegakkan `npm run lint`, lihat `eslint.config.js` blok `ANTISLOP`):** font minimal `text-xs` (12px) + font-weight tegas; tanpa `backdrop-blur`/glassmorphism; radius institusional (`rounded-md`/`rounded-lg`); animasi hanya untuk loading state terisolasi.
        *   **No decorative italic (judgement call, tetap di sini):** Dilarang menggunakan font miring (`italic`) pada data tabel audit, label regulasi, keterangan status, atau watermark audit. Teks kepatuhan BUMN harus tegas dan objektif.
        *   **Design system tokens (judgement call, tetap di sini):** Gunakan token Shadcn / Tailwind semantik (`--primary`, `--muted`, `--border`, dsb.), dilarang hardcoded warna neon/gradien ungu-pink acak.
2.  **Mandat Mobile-Responsive via Skill `better-interface` (Strict Enforcement):**
    *   Setiap kali membuat atau memodifikasi komponen/tampilan frontend dan komponennya (`src/**/*.tsx`), Anda **WAJIB** mengaktifkan skill `better-interface` (yang mengorkestrasi `better-accessibility`, `better-layout`, `better-typography`, `better-colors`, `better-ui`, `better-writing`) dan menerapkan hasil review-nya sebelum dianggap selesai. Cakupan pemicu mengikuti butir 1 (hanya ketika JSX/visual berubah).
    *   **Mobile-Responsive Checklist (320px → desktop):**
        *   **Mobile-first grid:** Base selalu satu kolom (`grid-cols-1` / `flex-col`); tambah kolom hanya di breakpoint (`sm:` / `md:` / `lg:` atau `min-[420px]:`). Dilarang `grid-cols-2/3/4` tetap di base 320px.
        *   **Tabel & Chart lebar aman:** Tabel dengan `min-w-[...]` atau grafik Recharts (`<ResponsiveContainer>`, `<BarChart>`, `<PieChart>`) WAJIB di dalam wrapper `overflow-x-auto max-w-full touch-pan-x overscroll-x-contain min-w-0`. Recharts dilarang dipasang dengan `min-w-[Xpx]` di level card container utama tanpa scroll wrapper mandiri, dan Pie/Donut Chart wajib simetris (`cx="50%"`, `cy="50%"`) tanpa offset yang menekan chart ke luar viewport.
        *   **Anti-Clipping Shell Architecture:** Dilarang menumpuk `overflow-x-clip` dan `overflow-hidden` di container level atas (`RootLayout`, `AppLayout`, `SidebarInset`) yang menjebak elemen anak dan menyebabkan hard clip di 320px–390px. Pembungkus halaman wajib menerapkan `min-w-0 max-w-full w-full`.
        *   **Dialog/Sheet footer:** Gunakan `flex-col-reverse sm:flex-row`; tombol `w-full sm:w-auto` dengan tinggi sentuh min 44px (`h-11 sm:h-10 min-h-[44px]`). Padding konten `p-4 sm:p-6`.
        *   **Header/toolbar anti-jepit:** Baris judul + aksi memakai `flex-col sm:flex-row` dengan `gap`, `min-w-0` + `truncate` pada teks, dan `flex-wrap` untuk badge; dilarang `flex justify-between` kaku yang menekan CTA di 360px.
        *   **Kalender/heatmap padat:** Di bawah `sm`, ringkas visual padat (indikator dot/hitungan, label hari 1 huruf, sel lebih pendek); detail penuh hanya di `sm+`.
        *   **Aman dari bottom nav:** Pastikan konten tidak tertutup `MobileBottomNav` (`pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0` di level layout); CTA kritis jangan diparkir di area terpotong.
        *   **Verifikasi viewport (Bukan Sekadar jsdom):** `npm test` berjalan di jsdom yang TIDAK menghitung layout CSS nyata, mengabaikan media query Tailwind, dan tidak mendeteksi overflow visual. Agen DILARANG menganggap `npm test` hijau sebagai bukti tampilan responsif mobile telah berhasil. Periksa secara analitis bounding box dan kalkulasi layout di 320px dan 360px; scroll horizontal halaman dilarang keras (hanya boleh di dalam container tabel/chart yang disengaja). Uji empty/loading/error state di lebar sempit.
3.  **Sinkronisasi Skema Database:** Jika ada perubahan pada `worker/db/schema.ts`, jalankan `npx drizzle-kit push` untuk menerapkan perubahan ke database PostgreSQL secara langsung. **Satu-satunya sumber DDL adalah `drizzle/*.sql` versioned** — dilarang `ALTER TABLE` runtime (`fixDatabaseSchema` auto-run, `/dev/fix-db`), DDL sekali-pakai di route, atau migrasi ad-hoc tanpa nomor urut + snapshot + journal entry.
4.  **Lokalisasi Penuh (i18n):** Periksa seluruh file yang dimodifikasi. Pastikan **TIDAK ADA** teks hardcoded (Inggris maupun Indonesia). Gunakan `useTranslation` dan file di `src/i18n/locales/**`.
5.  **Integritas Tipe:** Jalankan `npm run type-check`. Perbaiki semua error TS sebelum melangkah maju.
6.  **Standar Kode (Lint):** Jalankan `npm run lint`. Pastikan tidak ada peringatan atau error yang tersisa.
7.  **Verifikasi Kompilasi (Build):** Jalankan `npm run build`. Perubahan dianggap gagal jika proses build tidak berhasil.
8.  **Pengujian Otomatis (Test):** Jalankan `npm test`. Tambahkan unit test baru jika Anda menambahkan fitur baru atau melakukan perubahan di suatu fitur untuk mencegah regresi.
9.  **Deteksi Code Smell (Wajib tiap perubahan):** Sebelum dianggap selesai, pindai file yang disentuh terhadap katalog ini dan perbaiki yang ditemukan:
    *   **God file/module (anti-regresi DoDLampiran10 937 LOC):** batas dihitung via `scripts/check-loc.mjs` (**baris non-kosong**; total mentah `(Get-Content <file> | Measure-Object -Line).Lines` selalu sedikit lebih tinggi karena termasuk blank line).
        *   **Soft Limit 400 LOC** (`src/**/*.tsx`, `src/**/*.ts`, `worker/**/*.ts`): file tersentuh yang `>400 LOC` WAJIB dipecah dalam perubahan yang sama (ekstrak minimal 1 hook + 1 sub-komponen). Menambah fitur ke file `>400 LOC` tanpa memecah = gagal walau build hijau.
        *   **Hard Limit 600 LOC:** beku total — dilarang menambah logika baru sampai didekomposisi di bawah 400 LOC.
        *   **File baru maks 350 LOC.** Jika scaffold melebihi itu, kirim sejak awal sebagai split (mis. `types.ts` + `useX.ts` + `XHeader.tsx` + `XTable.tsx` + orkestrator `≤150 LOC`).
        *   **Structural caps (`*.tsx`):** maks 7 `useState` per komponen (dulu 10); orkestrator hanya komposisi (dilarang inline table/dialog/form JSX `>50` baris); tabel `>12` kolom wajib column-config + `.map` + row sub-komponen; blok JSX yang diduplikasi `≥3x` wajib config-driven (contoh pelanggaran: 14x `TooltipProvider` copy-paste di DoD).
        *   **Pengecualian sempit:** `shared/mock-data.ts`, `shared/constants/**` data-blob, `src/components/ui/**` (vendor shadcn), `**/*.test.*`, `**/*.spec.*`, `drizzle/*.sql`, file generated. Selain itu tidak ada pengecualian.
        *   **Grandfather (deadline saat disentuh):** file existing `>400 LOC` (contoh terkini: `bpm-service.ts` ~566, `RCMEditDialog.tsx` 550, `TodoListPage.tsx` 544, `WorkflowPanel.tsx` 543, `RegulatoryReportComponents.tsx` 542) hanya boleh menerima bug-fix minimal; fitur baru wajib pecah dulu. Setiap sentuhan harus menurunkan LOC atau mengekstrak `≥1` modul.
    *   **`any` / `as any` / escape-cast (`as never`, `as unknown as X`):** Dilarang menambah baru. Gunakan tipe domain dari `shared/types/*` (`common`, `org`, `scoping`, `rcm-bpm`, `csa-testing`, `deficiency`, `user`). `no-explicit-any` dalam mode `warn` — nol warning baru (cek otomatis: `npm run check:any-delta -- <file-tersentuh...>`). Escape-cast hanya diizinkan di boundary API/parser eksternal dengan komentar `// boundary: <alasan>` + test pendamping yang menguncinya; `as never` untuk membungkam error tipe dilarang keras.
    *   **Non-null assertion (`!`):** Dilarang pada data server (`children!`, `row!`). Gunakan `?? []` / `?.` + fallback.
    *   **Mirror server-state:** Dilarang `useQuery` → `useState` + `useEffect` sync dan assignment ref di render body. Gunakan cache React Query (`setQueryData`) untuk optimistic update.
    *   **Duplikasi terlarang:** Export Excel hanya via `src/lib/useExcelExport.ts` (larang `XLSX.*` langsung di `.tsx`); layout BPM hanya via `utils/bpm-auto-layout`; viewport mobile hanya via `hooks/use-mobile`; error HTTP hanya via `AppError` + `ok/bad/notFound` (`worker/lib/utils.ts`).
    *   **GET mutating & tanpa guard:** Dilarang endpoint `GET` yang mengubah data; operasi destruktif wajib `POST/DELETE` + `rbac` + env-guard non-prod + token konfirmasi.
    *   **String-match error & status salah:** Dilarang `e.message === '...'` untuk branching dan `notFound` untuk validasi 400. Gunakan `AppError(code, message, status)`.
    *   **Skrip tercecer & kredensial:** Dilarang file `*.ts` one-off di root repo atau kredensial hardcoded. Wajib di `scripts/` + `DATABASE_URL` dari env.
    *   **YAGNI & prefer one-liner:** Dilarang menambah abstraksi untuk kebutuhan hipotetis ("nanti mungkin butuh") — hook generik, wrapper, util, opsi config, file/komponen baru yang hanya dipakai sekali, atau prop/callback yang tidak ada pemakainya. Jika kasus nyata hari ini selesai dengan one-liner (inline expression, early return, optional chaining, `.map` langsung), pilih itu. Ekstraksi (hook/komponen/util/modul terpisah) HANYA dibenarkan jika salah satu terpenuhi: (a) dipakai ≥2 tempat, (b) butuh unit test tersendiri, atau (c) memecah god-file `>400 LOC`. Setiap file/fungsi/hook/tipe baru wajib bisa menjawab "pemakai kedua atau test apa yang mengujinya" — jika tidak ada, inline saja. Komentar "untuk jaga-jaga / future use" = hapus bersama kodenya.
10. **Penghapusan Tech Debt (Boy Scout Rule):** Setiap menyentuh modul, tinggalkan lebih bersih: (a) ekstrak 1 hook/komponen jika file >400 LOC (dulu 500), (b) ganti minimal 1 `any` dengan tipe domain, (c) pindahkan 1 string hardcoded ke `i18n`, (d) tambah/co-lokasi 1 test untuk logika yang diubah, (e) lampirkan bukti LOC gate untuk semua file tersentuh (nama file + jumlah baris sebelum/sesudah). Perubahan yang menambah `as any` baru, duplikat export-excel/layout, menaikkan file `>400 LOC` tanpa memecah, atau tabel tanpa test pendamping dianggap gagal walau build hijau.

## Development Conventions

*   **Regulatory Compliance:** Any UI or data model change MUST refer to Regulation SK-5/DKU.MBU/11/2024.
*   **Type Safety:** Shared types in `shared/types/*` (barrel `shared/types.ts`) are the source of truth. Import from the domain module (`common`, `org`, `scoping`, `rcm-bpm`, `csa-testing`, `deficiency`, `user`) — never re-introduce a god `types.ts` or `any` shims.
*   **Import Layering:** `shared/` is importable by both `src/` and `worker/`; never import `src/` from `worker/` or `worker/` from `src/` in product code — shared logic lives in `shared/` (precedent: `shared/control-linkage.ts` leveraged by editor hooks and bpm-sync/hydrator). Integration tests (`src/test/**`, `**/*.test.*`) are the sole exception and may import `worker/` services against a test database.
*   **Review Standards:** Judgement-call rules the reviewer enforces live in `CODING_STANDARDS.md` (read at review time, not implementation).
*   **Auditability:** Every entity mutation should be accompanied by an entry in the `auditTrail` and `ChangeLog`.
*   **Design Quality & Accessibility (Mandat design-taste-frontend):** Hindari segala bentuk "AI Slop". Patuhi aturan minimum font 12px, border-radius enterprise, dan surface kontras tinggi.
*   **Mobile-Responsive (Mandat better-interface):** Setiap edit `src/**/*.tsx` wajib mobile-first dan lolos checklist di Mandat Penyelesaian Tahap poin 2 (grid satu kolom di base, tabel dalam `overflow-x-auto`, footer dialog stack, verifikasi 320px/360px).
*   **Actionable Dashboard:** The Dashboard must function as an "Action Center," prioritizing urgent tasks (remediation, pending validation) to drive the ICOFR lifecycle.
*   **Data Persistence:** Always generate and run drizzle migrations using `npx drizzle-kit push` after schema changes.
*   **Localization:** Support multi-language (English/Indonesian) using `src/i18n/**`. All UI strings **MUST** be localized.
*   **Data Loss Prevention:** Implement `UnSavedChanges` warning for any form or editor state to prevent accidental data loss, following the `useUnsavedChanges` hook pattern.
*   **Navigation & Alerts:** Integrate critical workflows into the Sidebar menu and provide real-time feedback via a Notification Bell where appropriate.
*   **File Size & Modularization Threshold (Max LOC Rule — diperketat pasca-DoD 937 LOC):**
    *   **Soft Limit (400 LOC):** `src/**/*.tsx`, `src/**/*.ts`, `worker/**/*.ts` tidak boleh melebihi 400 baris (cara hitung: **baris non-kosong**, persis seperti `scripts/check-loc.mjs` — bukan total mentah `Measure-Object -Line`). File tersentuh yang melebihi 400 LOC WAJIB dipecah dalam PR yang sama (pola wajib: orkestrator `≤150 LOC` + `useX.ts` hook + `types.ts` + sub-komponen per area, tiap file baru `≤350 LOC`).
    *   **Hard Limit (600 LOC):** File `>600 LOC` beku total dari penambahan fungsional sampai didekomposisi di bawah 400 LOC. Pengecualian hanya untuk data-blob (`shared/mock-data.ts`, `shared/constants/**`), vendor (`src/components/ui/**`), test (`*.test.*`), dan `drizzle/*.sql`.
    *   **LOC Gate (wajib sebelum type-check):** jalankan `npm run check:loc -- <file-tersentuh...>` (gagal jika ada file tersentuh `>400 LOC`; `npm run check:loc -- --all` untuk pindaian repo, gagal jika ada file `>600 LOC`). Cantumkan hitungan file tersentuh di ringkasan PR. Skrip menghitung **baris non-kosong** (bukan total mentah `Measure-Object -Line`).
        Perubahan yang menaikkan file melewati 400/600 LOC tanpa split, atau tanpa bukti gate, dianggap gagal walau `npm test` hijau (jsdom tidak mendeteksi god-file).
    *   **Single Responsibility:** Separate orchestrator containers from isolated presentation widgets, modals, and business/state calculation logic. Duplikasi JSX `≥3x` (tooltip, sel tabel, kartu KPI, dialog) wajib diganti config-array + `.map`; tabel `>12` kolom wajib column-config + row sub-komponen.
    *   **Backend route split (pola baku):** Route domain `>400 LOC` dipecah menjadi `worker/routes/<domain>/` berisi satu sub-app Hono per area (`scoping-simulations.ts`, `scoping-snapshots.ts`, …) + barrel `worker/routes/<domain>.ts` yang me-mount semuanya via `.route('/', subApp)`. URL route harus byte-identical (tidak ada perubahan path/prefix); `default export` barrel tidak berubah sehingga `worker/app.ts` tidak disentuh.
    *   **Pure-logic extraction:** Komputasi bisnis (agregasi, mapping, kalkulasi, decision-tree, badge-config) dilarang inline di komponen/handler tanpa test — wajib tinggal di modul murni yang teruji (`aggregate-fsli.ts`, `ocr-shape-badges.ts`, `diagram-list-utils.ts`, `*-calc.ts`). Syarat YAGNI butir (b) terpenuhi otomatis oleh test pendampingnya.
*   **Quality Assurance:** Adhere to TDD (Test Driven Development) with a "Fail Fast, Fix Early" mindset. A task is only "Done" when it passes all steps in the **Mandat Penyelesaian Tahap**.
*   **Responsive Dual-Render Testing:** Komponen yang dual-render card mobile (`block md:hidden`) + tabel desktop (`hidden md:block`) muncul DUA KALI di jsdom karena class `hidden` Tailwind tidak menyembunyikan apa pun di test. Test WAJIB pakai `getAllByText` (mis. `toHaveLength(2)` untuk mengunci kedua view) atau scope query per view, dan WAJIB menegaskan scroll/sticky container via `closest()` bukan `parentElement` agar refactor wrapper responsif tidak mematahkan suite. (Pelajaran 2026-09-30: `RCMStickyHeader` + `CSARealizationTable`.)
*   **Heavy CLI Execution (Windows OOM Guard):** `type-check` / `lint` / `build` / `test` emit large output that can crash the PowerShell host with `System.OutOfMemoryException` when piped/buffered at once (observed 2026-09-28: `npm run type-check | Select-Object -Last 30` killed the host, while the same `tsc` redirected to a file exited 0).
    *   NEVER pipe heavy-command output through PowerShell formatters (`Select-Object -Last`, `tail`, `head`). Redirect to a file first, then read the file in chunks: `npx tsc --noEmit -p tsconfig.app.json > $env:TEMP\opencode\tsc-app.log 2>&1; echo "EXIT:$LASTEXITCODE"`.
    *   Unix `head`/`tail` do not exist in PowerShell — use `Select-Object -First/-Last` (or `Get-Content ... | Select-Object`), and only on files already written to disk, never on live heavy-command output.
    *   Run `type-check` per tsconfig (`tsconfig.app.json`, then `tsconfig.worker.json`) instead of the combined script when memory is constrained.
    *   If Node itself OOMs (JS heap), raise the heap first: `$env:NODE_OPTIONS="--max-old-space-size=4096"`.
    *   NEVER run two heavy commands in parallel (e.g. `build` + `test` at once) — concurrent Node processes exhaust OS RAM and crash with native `node::Realloc` assertion failures. Run them sequentially.

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues in this repo (`gh` CLI infers the repo from the clone). See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles mapped 1:1 to tracker labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` + `docs/adr/`. Read both before exploring an area; use glossary vocabulary in outputs. See `docs/agents/domain.md`.
