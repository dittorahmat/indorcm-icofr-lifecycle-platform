## Why

Halaman Verifikasi Rancangan Pengendalian (Verification Design - Lampiran 8) saat ini hanya mendukung pengeditan untuk data asesmen rancangan (TOD) yang sudah dimigrasikan atau sudah terpetakan dari RCM Lini 1. Pengguna (khususnya Lini 2 dan Admin) memerlukan kemampuan untuk menambahkan asesmen baru secara langsung (dari nol / scratch) apabila terdapat kontrol baru yang diidentifikasi atau prosedur pengujian tambahan yang belum terpetakan sebelumnya.

Saat ini juga terdapat kendala di mana data di tab "VERIFICATION DESIGN" pada **BPM Modal (Execution Hub)** tidak terfilter berdasarkan sub-proses BPM yang sedang dibuka. Hal ini disebabkan karena parameter pencarian di frontend (`bpmId`) tidak cocok dengan parameter yang diharapkan di backend API (`bpmProcessId`).

## What Changes

- **Frontend**:
  - Memperbaiki pemanggilan API di `VerificationDesignPage.tsx` agar menggunakan parameter query `bpmProcessId` (bukan `bpmId`) sehingga data yang dimuat terfilter secara dinamis sesuai BPM Proses yang sedang aktif.
  - Menambahkan tombol "Tambah Asesmen Baru" pada `VerificationDesignPage.tsx`.
  - Jika halaman dimuat secara tersemat (`embedded={true}`), render bilah alat (Toolbar) ringkas di atas tabel yang berisi kolom pencarian (Search Input) dan tombol "Tambah Asesmen Baru".
  - Membuat dialog baru `AddAssessmentDialog.tsx` yang menyerupai form edit (TOD, Informasi Umum, Kepatuhan IPO/Asersi, Metadata Sifat/Tipe).
  - Pada `AddAssessmentDialog.tsx`, jika `filterBpmId` dikirim dari modal, sistem akan secara otomatis mem-pre-select RCM yang cocok dengan sub-proses aktif tersebut, sehingga pengguna tidak perlu mencari atau mengisi informasi Proses/Sub-Proses dari awal.
  - Memperbarui komponen `RCMPageHeader.tsx` agar memiliki slot `children` untuk merender tombol aksi khusus pada tampilan halaman penuh.
  - Menambahkan lokalisasi key baru di `src/i18n/locales/id/rcm.json` dan `src/i18n/locales/en/rcm.json` untuk tombol, form input, dan notifikasi sukses.

- **Backend**:
  - Menambahkan API Endpoint `POST /api/rcm-matrix/verification-design` di `worker/routes/rcm.ts`.
  - Logika endpoint:
    1. Membuat atau mencocokkan entitas RCM (`rcms`) berdasarkan pilihan pengguna.
    2. Membuat entitas kontrol baru (`controls`) di bawah RCM tersebut.
    3. Membuat mapping kontrol (`rcm_controls`) yang berisi properti Lini 1 (Nama, Deskripsi, IPO, Asersi, Frekuensi, dll.).
    4. Membuat entitas evaluasi rancangan (`tod_evaluations`) untuk Lini 2 (Pilar TOD, Kesimpulan, Referensi Kertas Kerja, Komentar).
    5. Menjalankan logika defisiensi otomatis (`createAutoDeficiency`) apabila kesimpulan TOD diset sebagai "Ineffective".

## Capabilities

### New Capabilities
- `add-verification-assessment`: Kemampuan untuk menambahkan baris asesmen verifikasi rancangan kontrol baru dari awal secara mandiri di Lini 2.

### Modified Capabilities
- `verification-design-lifecycle`: Ekstensi siklus pengujian rancangan untuk mendukung penambahan baris secara langsung di tabel Lampiran 8, baik pada tampilan halaman penuh maupun tersemat di modal BPM dengan filtering sub-proses yang presisi.

## Impact

- `src/components/rcm/RCMPageHeader.tsx`: Penambahan prop `children` opsional.
- `src/pages/rcm/VerificationDesignPage.tsx`: Perbaikan query param `bpmProcessId`, integrasi tombol "Tambah Asesmen", pencarian ringkas di mode `embedded`, dan state dialog.
- `src/components/rcm/AddAssessmentDialog.tsx` [NEW]: Komponen dialog baru untuk pengisian asesmen dari nol dengan pre-select kontekstual.
- `worker/routes/rcm.ts`: Penambahan routing endpoint `POST /rcm-matrix/verification-design`.
- `src/i18n/locales/id/rcm.json` & `src/i18n/locales/en/rcm.json`: Penambahan string i18n.
