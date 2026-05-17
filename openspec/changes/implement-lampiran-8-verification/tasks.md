## 1. Backend & Data Layer

- [x] 1.1 Verifikasi kelengkapan field di tabel `controls` untuk asersi dan IPO sesuai Lampiran 8.
- [x] 1.2 Implementasi API endpoint `GET /api/rcm/verification-design` dengan join `controls`, `rcms`, dan `tod_evaluations`.
- [x] 1.3 Implementasi API endpoint `PATCH /api/rcm/verification-design/:id` untuk update metadata TOD.
- [x] 1.4 Tambahkan unit test untuk backend endpoint (Hono).

## 2. Frontend Infrastructure

- [x] 2.1 Tambahkan menu "Lampiran 8" di `src/components/app-sidebar.tsx` dan lokalisasi (i18n).
- [x] 2.2 Daftarkan route baru ke `VerificationDesignPage` di router utama.
- [x] 2.3 Buat kerangka halaman `src/pages/rcm/VerificationDesignPage.tsx`.

## 3. UI Component Implementation

- [x] 3.1 Implementasi `TanStack Table` dengan konfigurasi 35 kolom.
- [x] 3.2 Tambahkan logika `Sticky Column` untuk No dan Referensi Pengendalian.
- [x] 3.3 Implementasi group header (spanning headers) untuk kategori IPO, Asersi, dan Hasil TOD.
- [x] 3.4 Buat komponen `VerificationEditModal` dengan `react-hook-form` dan `zod`.
- [x] 3.5 Implementasi pembagian tab/seksi di dalam modal agar formulir lebih terorganisir.

## 4. Business Logic & RBAC

- [x] 4.1 Tambahkan proteksi hak akses (RBAC) pada icon pensil dan submit.
- [x] 4.2 Implementasi data mapping dari RCM ke form modal TOD.
- [x] 4.3 Implementasi `Optimistic Update` menggunakan TanStack Query saat simpan data.

## 5. Validation & Finalization

- [x] 5.1 Jalankan `npm run type-check` dan perbaiki error.
- [x] 5.2 Jalankan `npm run lint` dan perbaiki peringatan.
- [x] 5.3 Jalankan automated test untuk komponen tabel dan modal.
- [x] 5.4 Jalankan `npm run build` untuk verifikasi akhir.

