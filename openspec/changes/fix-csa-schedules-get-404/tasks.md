## 1. Backend Refactor & Implementation

- [x] 1.1 Implementasi `GET /api/csa/schedules` di `worker/routes/csa.ts` untuk mengambil data dari tabel `csaSchedules`.
- [x] 1.2 Hapus rute duplikat `csa.get('/csa', ...)` di baris awal `worker/routes/csa.ts` (sekitar baris 18).
- [x] 1.3 Verifikasi rute `GET /api/csa` yang tersisa (Smart CSA section) tetap bekerja dengan baik untuk semua parameter.

## 2. Frontend Verification

- [x] 2.1 Verifikasi halaman `TodoListPage.tsx` dapat memuat data jadwal tanpa error 404 di Network tab.
- [x] 2.2 Pastikan kalender dan sidebar menampilkan data yang benar dari database.

## 3. Validation & Testing

- [x] 3.1 Jalankan `npm run type-check` untuk memastikan tidak ada error tipe setelah perubahan backend.
- [x] 3.2 Lakukan tes manual (atau buat unit test jika diperlukan) untuk memastikan filtering `organizationId` bekerja dengan benar di endpoint baru.
