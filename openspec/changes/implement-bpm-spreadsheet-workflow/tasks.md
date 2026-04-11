# Tasks: BPM Spreadsheet Workflow

## 1. Data Model & Backend
- [x] 1.1 Update `shared/types.ts`: Tambahkan interface `BPMProcess` dan perluas interface `Control` dengan PDF fields.
- [x] 1.2 Update `worker/entities.ts`: Registrasikan `BPMProcessEntity`.
- [x] 1.3 Update `worker/user-routes.ts`: Implementasi API `/api/bpm-processes` (CRUD).
- [x] 1.4 Update `worker/user-routes.ts`: Implementasi auto-logging ke `ChangeLogEntity` saat update control detail.

## 2. Sidebar & Navigation
- [x] 2.1 Update `src/components/app-sidebar.tsx`: Rename "/csa" menjadi "Control Self Assessment" dan tambah menu "BPM".
- [x] 2.2 Update `src/main.tsx`: Daftarkan route baru `/bpm` yang mengarah ke `BPMPage.tsx`.

## 3. UI: BPM Page & Header
- [x] 3.1 Create `src/pages/bpm/BPMPage.tsx`: Struktur dasar dengan Header Search (Cascading FSLI -> GL).
- [x] 3.2 Implementasi folder tab untuk list BPM Process per GL terpilih.
- [x] 3.3 Implementasi tombol "Create BPM" dengan modal input judul proses.

## 4. UI: Spreadsheet Worksheet
- [x] 4.1 Create `src/components/bpm/BPMWorksheet.tsx`: Integrasi TanStack Table dengan custom cell renderers.
- [x] 4.2 Implementasi `EditableCell` dengan debounced auto-save logic.
- [x] 4.3 Implementasi dropdown "Aplikasi Signifikan" dengan opsi "+ Add New Application".
- [x] 4.4 Integrasi tombol "BPM Workflow" di kolom terakhir untuk membuka diagram editor.

## 5. Validation
- [ ] 5.1 Verifikasi alur cascading filter: Pilih Kas -> Muncul GL Kas -> Muncul Proses BPM terkait Kas.
- [ ] 5.2 Verifikasi log perubahan: Edit sel -> Cek di database `changelogs` apakah nilai sebelum/sesudah tersimpan sesuai format Lampiran 6.
- [ ] 5.3 Verifikasi satu diagram sub-proses muncul konsisten di baris yang berbeda dengan sub-proses yang sama.
