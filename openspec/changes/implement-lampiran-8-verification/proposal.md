## Why

Digitalisasi Lampiran 8 (Verifikasi Rancangan Pengendalian) diperlukan untuk memenuhi mandat Regulasi SK-5/DKU.MBU/11/2024. Saat ini, proses verifikasi rancangan (Test of Design - TOD) oleh Lini Kedua masih bersifat manual atau belum terintegrasi secara tabular yang editable dalam platform IndoGRC Pro. Fitur ini akan memfasilitasi Fungsi ICOFR dan Admin untuk memvalidasi efektivitas rancangan pengendalian secara akurat dan auditable.

## What Changes

- **Halaman Baru**: Menambahkan halaman "Verifikasi Rancangan Pengendalian" di bawah menu Reporting & RCM.
- **Tabel Tabular Komprehensif**: Menampilkan ke-35 kolom sesuai mandat Lampiran 8, ditarik otomatis dari data RCM (Lampiran 5).
- **Sticky UI**: Implementasi kolom beku (sticky) untuk identitas pengendalian guna menjaga konteks saat scroll horizontal.
- **Fitur Full Edit**: Lini Kedua dan Admin dapat mengubah seluruh data atribut dan hasil pengujian TOD.
- **Modal Editor**: Antarmuka popup untuk pengisian data yang dibagi menjadi beberapa bagian/tab agar tidak overwhelming.
- **Backend Persistence**: Penambahan kolom/field di schema database untuk menyimpan metadata hasil pengujian TOD.

## Capabilities

### New Capabilities
- `verification-design-control`: Menangani logika verifikasi rancangan pengendalian (TOD), penyimpanan metadata pengujian, dan visualisasi tabular Lampiran 8.

### Modified Capabilities
- `rcm-management`: Mengintegrasikan data RCM dasar sebagai basis data awal untuk Lampiran 8.

## Impact

- **UI/UX**: Perubahan pada sidebar dan penambahan komponen tabel lebar.
- **Database**: Penambahan field pada tabel `controls` atau tabel relasi baru di Drizzle schema.
- **Role Access**: Implementasi filter akses untuk Lini 2 dan Admin pada fitur edit.
