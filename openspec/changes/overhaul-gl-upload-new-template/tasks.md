# Tasks: Overhaul GL Upload & Scoping Logic

## 1. Data Foundation
- [x] 1.1 Update `shared/types.ts`: Tambahkan kolom baru ke `GLRow`.
- [x] 1.2 Update `src/lib/compliance-utils.ts`: Update `GL_COLUMN_MAPPING` untuk menyertakan `kategori`, `subKategori`, `fsliName`, `fsliBalance`, dan `noUrut`.
- [x] 1.3 Update `src/lib/compliance-utils.ts`: Refactor `calculateBenchmarkValue` menggunakan `subKategori` logic.

## 2. Upload Logic
- [x] 2.1 Update `ScopingPage.tsx`: Refactor `onDrop` untuk melakukan parsing kolom baru dan trimming header secara menyeluruh.
- [ ] 2.2 Verifikasi: Tes upload file CSV dan XLSX terbaru, pastikan kolom `subKategori` terisi.

## 3. UI Refinement
- [x] 3.1 Update `GLDataGrid.tsx`: Ubah grouping state dari `fsliCode` ke `fsliName`.
- [x] 3.2 Update `GLDataGrid.tsx`: Tambahkan kolom `No Urut` di worksheet untuk kemiripan dengan template.
- [x] 3.3 Update `GLDataGrid.tsx`: Pastikan tampilan header tetap compact meskipun kolom bertambah.

## 4. Validation
- [ ] 4.1 Verifikasi kalkulasi OM/PM di halaman simulasi sudah otomatis mengambil angka dari grouping `Sub_Kategori`.
- [ ] 4.2 Pastikan flagging Y/N tetap akurat dengan data grouping yang baru.
