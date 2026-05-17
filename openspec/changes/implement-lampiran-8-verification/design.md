## Context

Regulasi SK-5/DKU.MBU/11/2024 mewajibkan verifikasi rancangan pengendalian (Test of Design - TOD) oleh Lini Kedua. Lampiran 8 menyediakan matriks komprehensif 35 kolom untuk mendokumentasikan hasil verifikasi ini. Saat ini, sistem sudah memiliki tabel `tod_evaluations` di database, namun belum ada antarmuka terintegrasi yang menampilkan seluruh kolom Lampiran 8 secara tabular yang editable.

## Goals / Non-Goals

**Goals:**
- Implementasi halaman tabular "Verifikasi Rancangan Pengendalian" sesuai Lampiran 8.
- Integrasi data dari `controls` dan `tod_evaluations`.
- Antarmuka pengeditan modal yang mendukung RBAC (Admin & Lini 2).
- Performa tabel yang responsif untuk 35+ kolom menggunakan horizontal scroll dan sticky columns.

**Non-Goals:**
- Implementasi pengujian efektivitas operasi (TOE) - fokus hanya pada rancangan (TOD).
- Automasi penilaian (Sistem tetap mengandalkan input manual dari Lini 2).

## Decisions

- **UI Component**: Menggunakan `TanStack Table` (React Table) untuk fleksibilitas manajemen kolom dan state.
- **Sticky Pillars**: Mengunci kolom "No" dan "Referensi Pengendalian" di sisi kiri untuk navigasi context-aware.
- **Backend Integration**: 
  - `GET /api/rcm/verification-design`: Endpoint baru yang melakukan JOIN antara `controls`, `rcms`, dan `tod_evaluations`.
  - `PATCH /api/rcm/verification-design/:id`: Melakukan update pada metadata TOD.
- **State Management**: React Hook Form + Zod untuk validasi form di modal popup.
- **Database Schema**: Memanfaatkan tabel `tod_evaluations` yang sudah ada, serta menambahkan field jika ada kolom Lampiran 8 yang belum tercover di schema `controls`.

## Risks / Trade-offs

- **[Risk] Tabel Terlalu Lebar** → [Mitigation] Implementasi group header dan horizontal scrollbar yang intuitif serta sticky column.
- **[Risk] Data Overlap** → [Mitigation] Form modal akan melakukan *pre-populate* data dari `controls` dan `rcms`. Perubahan pada atribut dasar pengendalian di halaman ini akan di-sinkronisasi kembali ke tabel `controls`.
