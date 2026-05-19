## Why

Halaman `TodoListPage.tsx` mengalami error 404 saat mencoba mengambil jadwal CSA via `GET /api/csa/schedules`. Investigasi menunjukkan bahwa backend rute `/api/csa/schedules` sudah memiliki handler untuk `POST`, `PUT`, dan `DELETE`, namun handler `GET` belum diimplementasikan. Selain itu, ditemukan rute duplikat `GET /csa` yang perlu dibersihkan untuk menjaga integritas kode.

## What Changes

- Menambahkan endpoint `GET /csa/schedules` di `worker/routes/csa.ts` untuk mengambil daftar jadwal CSA berdasarkan `organizationId`.
- Menghapus rute duplikat `csa.get('/csa', ...)` di `worker/routes/csa.ts`.
- Memastikan fungsionalitas pengambilan data di frontend `TodoListPage.tsx` berjalan dengan baik setelah endpoint tersedia.

## Capabilities

### New Capabilities
- `csa-schedule-retrieval`: Kemampuan untuk mengambil daftar jadwal CSA yang terencana dari database untuk ditampilkan di kalender dan sidebar Todo List.

### Modified Capabilities
- `csa-management`: Memperbarui kontrak API untuk memastikan konsistensi antara manajemen jadwal dan pengambilan datanya.

## Impact

- `worker/routes/csa.ts`: Penambahan rute GET baru dan penghapusan rute lama yang tidak digunakan/duplikat.
- `src/pages/csa/TodoListPage.tsx`: Fungsionalitas pengambilan data (React Query) akan mulai bekerja tanpa error 404.
