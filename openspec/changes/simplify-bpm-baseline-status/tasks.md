## 1. i18n Wording

- [x] 1.1 Tambah key `baseline.emptyTitle` di `src/i18n/locales/en/bpm.json` dan `src/i18n/locales/id/bpm.json`, lalu verifikasi dengan membuka kedua file dan memastikan tidak ada hardcoded string baru.
- [x] 1.2 Tambah key aksi `Buka Scoping` (mis. `baseline.openScoping`: `Open Scoping` / `Buka Scoping`) di kedua locale dan verifikasi via pencarian key di file.

## 2. Compact Banner

- [x] 2.1 Ubah cabang empty-state di `src/components/bpm/BPMStatusBanner.tsx` menjadi strip kompak satu baris (ikon 32px + judul + deskripsi + tombol Link ke Scoping dengan `year`), samakan pola dengan cabang Approved, dan verifikasi dengan `npm run type-check`.
- [x] 2.2 Ganti judul banner dari gabungan `baseline.status + common:status.rejected` menjadi `t('bpm:baseline.emptyTitle', { year })` dan verifikasi tidak ada lagi teks `Rejected` pada state empty (cek EN dan ID di browser).
- [x] 2.3 Pastikan tidak ada pelanggaran anti-slop (min font `text-xs`, radius `rounded-md/lg`, tanpa `backdrop-blur`, tanpa animasi pada badge statis) dan verifikasi dengan `npm run lint`.

## 3. Workflow History Accordion

- [x] 3.1 Bungkus blok history + compliance note di `src/components/workflow/WorkflowPanel.tsx` dalam collapsible tertutup default dengan label `Riwayat (N)` / `History (N)` dari `history.length`, aksi tetap di luar, dan verifikasi dengan `npm run type-check`.
- [x] 3.2 Pastikan state kosong (`history.length === 0`) tetap menampilkan empty-state kecil yang sudah ada saat accordion dibuka dan verifikasi manual di BPM dengan proses tanpa riwayat.

## 4. Verification

- [x] 4.1 Jalankan `npm run build` dan pastikan berhasil tanpa error.
- [x] 4.2 Jalankan `npm test` dan pastikan seluruh suite hijau (atau catat kegagalan pre-existing yang tidak terkait).
- [x] 4.3 Verifikasi visual manual: banner empty tampil satu baris dengan tombol ke Scoping (EN + ID), panel proses menampilkan aksi dengan riwayat terlipat default dan dapat di-expand.
