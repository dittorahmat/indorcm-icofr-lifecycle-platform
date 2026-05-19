## Context

Halaman `TodoListPage.tsx` menggunakan endpoint `/api/csa/schedules` untuk menampilkan data jadwal di kalender. Saat ini, backend di `worker/routes/csa.ts` hanya mendukung operasi mutasi (`POST`, `PUT`, `DELETE`) namun tidak mendukung operasi query (`GET`). Selain itu, terdapat redundansi rute `GET /api/csa` yang perlu dirapikan untuk menghindari kebingungan di masa depan.

## Goals / Non-Goals

**Goals:**
- Mengimplementasikan endpoint `GET /api/csa/schedules` yang mengembalikan data jadwal CSA terfilter berdasarkan `organizationId`.
- Membersihkan rute duplikat `GET /api/csa` di file `worker/routes/csa.ts`.
- Memastikan integritas data dan performa pengambilan data tetap terjaga.

**Non-Goals:**
- Mengubah skema database `csa_schedules`.
- Mengubah logika mutasi (`POST`/`PUT`/`DELETE`) yang sudah ada, kecuali jika diperlukan untuk konsistensi.
- Menambahkan fitur baru di luar perbaikan bug 404.

## Decisions

- **Decision 1: Implementasi Query GET**: Menggunakan Drizzle ORM untuk mengambil semua baris dari tabel `csaSchedules` di mana `organizationId` cocok dengan konteks pengguna.
  - *Rationale*: Ini adalah pendekatan standar dalam aplikasi ini untuk memastikan isolasi data antar organisasi.
- **Decision 2: Cleanup Duplicate Routes**: Menghapus definisi rute `csa.get('/csa', ...)` yang berada di baris awal `worker/routes/csa.ts` karena sudah didefinisikan kembali dengan logika yang lebih lengkap di bagian bawah file (Smart CSA section).
  - *Rationale*: Redundansi rute dapat menyebabkan bug yang sulit dilacak jika salah satu versi diperbarui sementara yang lain tidak.

## Risks / Trade-offs

- **[Risk]** Penghapusan rute duplikat mungkin memengaruhi komponen lama yang belum menggunakan filter query params. → **Mitigation**: Lakukan verifikasi bahwa semua pemanggil rute `/api/csa` (jika ada) masih berfungsi dengan handler yang tersisa.
- **[Risk]** Format tanggal di `csaSchedules` (timestamp) mungkin memerlukan konversi saat dikirim ke frontend. → **Mitigation**: Gunakan format objek Date standar yang bisa diparse oleh React Query dan `date-fns` di frontend.
