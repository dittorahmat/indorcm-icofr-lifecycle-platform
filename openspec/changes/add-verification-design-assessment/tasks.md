## 1. Backend & Data Layer

- [x] 1.1 Implementasi endpoint `POST /api/rcm-matrix/verification-design` dengan guard `rbac(['Line 2', 'Admin'])`.
- [x] 1.2 Tambahkan logika deteksi RCM: gunakan `rcmId` yang ada, atau buat data baru di tabel `rcms` jika pengguna memilih opsi RCM baru.
- [x] 1.3 Tambahkan logika pembuatan data di tabel `controls`, `rcm_controls`, dan `tod_evaluations` dalam satu transaksi database.
- [x] 1.4 Integrasikan trigger pembuatan defisiensi otomatis (`createAutoDeficiency`) jika `conclusion` diatur sebagai "Ineffective".

## 2. Frontend Infrastructure & i18n

- [x] 2.1 Tambahkan key lokalisasi baru untuk form tambah asesmen di `src/i18n/locales/id/rcm.json` dan `src/i18n/locales/en/rcm.json`.
- [x] 2.2 Perbarui `src/components/rcm/RCMPageHeader.tsx` agar mendukung prop `children` untuk rendering tombol aksi.
- [x] 2.3 Perbaiki parameter query di `VerificationDesignPage.tsx` dari `bpmId` menjadi `bpmProcessId` agar sinkron dengan parameter API backend dan filter data berjalan dengan benar.

## 3. UI Component Implementation

- [x] 3.1 Buat komponen dialog baru `src/components/rcm/AddAssessmentDialog.tsx` dengan field RCM Selection, Tab Info Lini 1, Tab Kepatuhan IPO & Asersi, Tab Metadata Kontrol, dan Tab TOD Lini 2.
- [x] 3.2 Hubungkan API query `/api/rcm` untuk menampilkan daftar pilihan RCM (Proses - Sub Proses - Risiko) pada dropdown/combobox.
- [x] 3.3 Tambahkan logika pre-select RCM dan pre-fill Nama Proses/Sub Proses di `AddAssessmentDialog` berdasarkan parameter `filterBpmId` ketika dibuka dari modal.
- [x] 3.4 Buat toggle/checkbox "Buat RCM Baru" yang memunculkan input Nama Proses, Sub Proses, dan Deskripsi Risiko dari nol.

## 4. Page Integration & Verification

- [x] 4.1 Tambahkan tombol "Tambah Asesmen Baru" di header `VerificationDesignPage.tsx` jika `embedded={false}` dan `canEdit` bernilai true.
- [x] 4.2 Tambahkan bilah alat (toolbar) ringkas di atas `RCMTable` ketika `embedded={true}` yang merender kolom pencarian dan tombol "Tambah Asesmen Baru" (untuk tampilan di dalam `BPMModal`).
- [x] 4.3 Integrasikan state `isAddingItem` dan render komponen `AddAssessmentDialog` pada `VerificationDesignPage.tsx`.
- [x] 4.4 Jalankan validasi `npm run type-check`.
- [x] 4.5 Jalankan linting `npm run lint`.
- [x] 4.6 Jalankan `npm run build` untuk memastikan proyek dapat terkompilasi dengan sukses.
