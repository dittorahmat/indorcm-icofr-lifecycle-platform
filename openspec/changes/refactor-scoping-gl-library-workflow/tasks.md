# Tasks: Unified Scoping Control Center

## 1. Data Foundation & Migration
- [x] 1.1 Update `shared/types.ts`: Tambahkan `isActive: boolean` ke `GLSnapshot`. Update `assessmentData` di `MaterialitySimulation`.
- [x] 1.2 Purge Data: Buat fungsi/endpoint untuk mengosongkan seluruh data lama yang tidak kompatibel.
- [x] 1.3 Update `src/lib/compliance-utils.ts`: Ganti total `calculateBenchmarkValue` agar murni menggunakan `benchmarkMapping`.

## 2. API Endpoints
- [x] 2.1 Update `worker/user-routes.ts`: Implementasi `POST /api/gl-snapshots/:id/set-active` (logic radio-button).
- [x] 2.2 Update `worker/user-routes.ts`: Ensure `POST /api/gl-snapshots` otomatis mengeset `isActive: true` jika itu file pertama.
- [x] 2.3 Refactor Endpoint `PUT /api/simulations/:id`: Pastikan simpan ID Snapshot yang dipilih.

## 3. UI: Scoping Control Center (Master Page)
- [x] 3.1 Refactor `ScopingPage.tsx`: Ganti sistem Card menjadi 2 Tab Tabel (Master Data GL & Simulation Scenarios).
- [x] 3.2 Implement `GLSourceTable.tsx`: Komponen tabel untuk daftar file GL dengan tombol Set Active.
- [x] 3.3 Implement `SimulationListTable.tsx`: Komponen tabel untuk daftar simulasi.
- [x] 3.4 Implement `SetBenchmarkModal.tsx`: Modal mapping FSLI.

## 4. UI: Worksheet Cleanup
- [x] 4.1 Update `GLDataGrid.tsx`: Hapus seluruh kolom OM/PM dan icon petir dari tabel.
- [x] 4.2 Update `GLDataGrid.tsx`: Ganti isi sel kolom "Kuan" (dari Y/N) menjadi teks "Significant" / "Not Significant".
- [x] 4.3 Update `GLDataGrid.tsx`: Ganti nama header untuk 8 kolom kualitatif sesuai dokumen baru (Kecurangan, Volume, dll).
- [x] 4.4 Update `GLDataGrid.tsx`: Pindahkan dropdown select kualitatif ke baris grup (FSLI header). Update state handling agar membaca FSLIName.
- [x] 4.5 Update logika `finalStatus`: Evaluasi flag "IN (QUAL)" untuk semua anak akun jika parent FSLI-nya dinilai "High".

## 5. Validation
- [x] 5.1 Verifikasi alur: Upload GL -> Set Active -> Create Simulation -> Lihat angka PM otomatis terisi.
- [x] 5.2 Pastikan jika pindah Snapshot Active di Master Data, simulasi yang lama datanya tidak berubah (lock to original source).
