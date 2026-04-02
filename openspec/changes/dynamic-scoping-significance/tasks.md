## 1. Logic Updates in ScopingPage.tsx

- [ ] 1.1 Hapus filter `.filter(acc => acc.isQuantitative)` di dalam fungsi `handleDataImported` agar seluruh akun GL tersimpan.
- [ ] 1.2 Pastikan `isQuantitative` dihitung secara dinamis saat render menggunakan `performanceMateriality` terbaru.
- [ ] 1.3 Update perhitungan `significantBalance` dan cakupan ruang lingkup agar tetap akurat berdasarkan status signifikansi dinamis.

## 2. UI Enhancements

- [ ] 2.1 Perbarui tampilan tabel 'Significant Accounts Matrix' agar menampilkan seluruh akun dari `localAccounts`.
- [ ] 2.2 Terapkan gaya visual yang berbeda (misalnya: warna badge `secondary` atau opacity lebih rendah) untuk akun yang tidak signifikan.
- [ ] 2.3 Tambahkan indikator jumlah total akun vs akun signifikan di header tabel.

## 3. Verification

- [ ] 3.1 Verifikasi bahwa mengubah Haircut % secara otomatis memperbarui status 'Significant' pada daftar akun tanpa perlu re-upload.
- [ ] 3.2 Verifikasi bahwa akun dengan saldo di bawah PM tetap muncul namun ditandai sebagai 'Insignificant'.
- [ ] 3.3 Pastikan cakupan % ruang lingkup (Cakupan Ruang Lingkup) terupdate secara real-time saat parameter materialitas berubah.
