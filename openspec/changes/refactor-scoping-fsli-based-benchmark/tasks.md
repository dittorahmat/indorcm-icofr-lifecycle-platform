# Tasks: FSLI-Based Benchmark & UI Refinement

## 1. Data Model
- [x] 1.1 Update `shared/types.ts`: Ganti `benchmarkMapping` di `GLSnapshot` menjadi `benchmarkFsliNames: string[]`.
- [x] 1.2 Update `shared/types.ts`: Ubah tipe `basis` di `MaterialitySimulation` menjadi `string`.

## 2. Backend & Utils
- [x] 2.1 Update `src/lib/compliance-utils.ts`: Refactor `calculateBenchmarkValue` untuk menghitung saldo murni berdasarkan FSLI Name yang dipilih sebagai basis.
- [x] 2.2 Update `worker/user-routes.ts`: Sesuaikan endpoint `PUT /api/gl-snapshots/:id/mapping` untuk menyimpan array string.

## 3. UI: Set Benchmark Modal
- [x] 3.1 Update `SetBenchmarkModal.tsx`: Rombak tabel menjadi sistem Checkbox tunggal.
- [x] 3.2 Implementasikan feedback ringkasan saldo untuk FSLI yang dipilih di panel kanan modal.

## 4. UI: Global Labels & Sidebar
- [x] 4.1 Update `src/components/app-sidebar.tsx`: Ubah menu label menjadi "Significant Account Identification".
- [x] 4.2 Update `ScopingPage.tsx`: Ubah judul halaman dan deskripsi.
- [x] 4.3 Update `ScopingPage.tsx`: Perbarui form `New Simulation` agar dropdown Basis mem-map `activeSnapshot.benchmarkFsliNames`. Tampilkan warning jika array kosong.

## 5. UI: Worksheet (GLDataGrid)
- [x] 5.1 Update `GLDataGrid.tsx`: Ubah label header kolom (KUAN -> Kuantitatif, Code -> Entity Code).
- [x] 5.2 Update `GLDataGrid.tsx`: Implementasikan `columnVisibility` untuk menyembunyikan `#` namun tetap menjaga default sort by `#` ASC.
- [x] 5.3 Update `GLDataGrid.tsx`: Tingkatkan ukuran font dan padding pada Badge "IN SCOPE".
- [x] 5.4 Implementasikan fitur "Export as Excel" menggunakan library `xlsx`. Pastikan baris header grup ikut ter-export.

## 6. Validation
- [ ] 6.1 Tes alur: Mark FSLI "Pendapatan" sebagai benchmark -> Buat simulasi pakai basis "Pendapatan" -> Cek nilai OM/PM akurat.
- [ ] 6.2 Verifikasi hasil export Excel memiliki struktur data yang terbaca dan tebal pada baris header.
