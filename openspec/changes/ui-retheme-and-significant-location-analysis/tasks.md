# Tasks: UI Re-theme & Significant Location Analysis

## 1. Visual Re-theming
- [x] 1.1 Update `src/components/app-sidebar.tsx`: Ubah background ke Tuft Blue, teks ke Putih Bold.
- [x] 1.2 Update `src/components/layout/MainHeader.tsx`: Ubah background ke Tuft Blue.
- [x] 1.3 Verifikasi kontras warna di seluruh halaman (pastikan teks terbaca).

## 2. Data Model
- [x] 2.1 Update `shared/types.ts`: Tambah `locationThreshold` dan `locationResults` ke `MaterialitySimulation`.
- [x] 2.2 Update `worker/entities.ts`: Sinkronkan `SimulationEntity.initialState`.

## 3. UI: Significant Location Analysis
- [x] 3.1 Create `src/components/scoping/SignificantLocationModal.tsx`: Implementasi tabel Pareto 80%.
- [x] 3.2 Update `src/components/scoping/SimulationListTable.tsx`: Tambah kolom dan tombol "Analyze" untuk memicu modal.
- [x] 3.3 Implementasi logic sinkronisasi: Simpan hasil analisis lokasi kembali ke database simulasi.

## 4. Validation
- [x] 4.1 Verifikasi: Buka modal lokasi -> Angka % Kumulatif sesuai dengan file `significant location.csv`.
- [x] 4.2 Verifikasi: Ubah threshold (misal ke 90%) -> Flag Y/N terupdate otomatis.
