## 1. Refactor Store Persistensi

- [x] 1.1 Update `src/store/useFiscalYearStore.ts` untuk menggunakan middleware `persist` dari Zustand.
- [x] 1.2 Sesuaikan logika `getInitialYear` agar memprioritaskan URL parameter sebelum mengambil dari storage terhidrasi.
- [x] 1.3 Implementasi event listener `storage` global untuk mendeteksi perubahan dari tab lain.

## 2. Integrasi Sinkronisasi & Safety Guard

- [x] 2.1 Tambahkan logika pengecekan `isDirty` (via context) sebelum mengizinkan sinkronisasi tahun otomatis di komponen `FiscalYearSelector` atau Root Layout.
- [x] 2.2 Pastikan pergantian tahun manual tetap memicu update ke `localStorage` dan URL.

## 3. Verifikasi & Pengujian

- [x] 3.1 Verifikasi bahwa buka tab baru (tanpa URL param) otomatis mengikuti tahun dari tab sebelumnya.
- [x] 3.2 Verifikasi bahwa perubahan tahun di satu tab mengupdate tab lain secara instan.
- [x] 3.3 Verifikasi bahwa tab dengan data belum disimpan (`isDirty`) mengabaikan sinkronisasi otomatis.
- [x] 3.4 Jalankan `npm run build` dan `npm test` untuk memastikan tidak ada regresi.
