## Context

Verifikasi Rancangan Pengendalian (Test of Design - TOD) dievaluasi oleh Lini 2 untuk menilai apakah aktivitas pengendalian yang dirancang Lini 1 memadai untuk memitigasi risiko keuangan. Saat ini, baris data verifikasi hanya dibuat melalui proses migrasi Excel atau sinkronisasi BPM. Pengguna memerlukan tombol tambah baris agar dapat memasukkan kontrol baru secara ad-hoc tanpa harus mengulangi migrasi data baseline.

Tombol tambah asesmen ini harus dapat diakses dari:
1. Halaman penuh `/rcm/verification-design` (terletak di header halaman).
2. Tab "VERIFICATION DESIGN" di dalam modal detail BPM (BPMModal) secara tersemat.

Di samping itu, data pada Tab "VERIFICATION DESIGN" harus terfilter secara otomatis berdasarkan sub-proses BPM yang sedang dibuka. Saat ini hal tersebut gagal karena ketidakcocokan nama parameter antara frontend (`bpmId`) dan backend (`bpmProcessId`).

## Goals / Non-Goals

**Goals:**
- Menyediakan dialog `AddAssessmentDialog` untuk penginputan data asesmen rancangan baru dari nol.
- Memungkinkan pengguna mengaitkan asesmen baru ke RCM (risiko) yang sudah ada, atau membuat risiko RCM baru di tempat.
- **Filtering Sub-Proses**: Memperbaiki pemanggilan API agar data terfilter hanya untuk sub-proses aktif (misal: "Penerimaan Setoran Tunai").
- **Kontekstual Pre-select**: Mengisi atau mengunci pilihan RCM/Proses secara otomatis di dialog tambah jika dibuka dari dalam modal sub-proses tertentu.
- Menyediakan toolbar ringkas (Search Input + "Add Assessment" button) di bagian atas tabel ketika berada di mode `embedded`.
- Menerapkan integrasi penuh ke endpoint backend baru untuk menjamin integritas referensi asing (Foreign Key) di database (`rcms`, `controls`, `rcm_controls`, dan `tod_evaluations`).
- Menjalankan logika defisiensi otomatis (auto-deficiency) jika kesimpulan TOD adalah "Ineffective".

**Non-Goals:**
- Mengubah struktur atau relasi database yang sudah ada.
- Menyediakan fitur unggah lampiran dokumen pendukung secara massal di dialog ini (hanya input teks link/referensi).

## Decisions

### 1. Unified Dialog Structure with RCM Selection & Contextual Pre-select
**Keputusan:** Membuat dialog `AddAssessmentDialog` dengan struktur tab yang mirip dengan `VerificationEditDialog`. 
- Jika `filterBpmId` disediakan, dropdown RCM akan difilter atau secara otomatis menunjuk pada RCM yang terkait dengan `bpmProcessId` tersebut. 
- Jika pengguna memilih membuat RCM baru di dalam modal sub-proses, isian *Process Name* dan *Sub-Process Name* akan secara otomatis terisi (pre-filled) dengan identitas sub-proses BPM yang sedang terbuka tersebut.
**Rasional:** Meningkatkan efisiensi kerja Lini 2 sehingga mereka tidak perlu menginput data yang berulang ketika konteksnya sudah jelas dari modal BPM yang sedang dibuka.

### 2. Dual-Mode Toolbar Layout & Parameter Fix
**Keputusan:** 
- Memperbarui query key dan fetcher URL di `VerificationDesignPage.tsx` menjadi:
  `const url = filterBpmId ? `/api/rcm-matrix/verification-design?bpmProcessId=${filterBpmId}` : '/api/rcm-matrix/verification-design';`
- **Mode Halaman Penuh (`embedded={false}`)**: Tombol "Add Assessment" dirender di dalam slot `children` pada `RCMPageHeader`.
- **Mode Tersemat (`embedded={true}`)**: Toolbar ringkas yang berisi input pencarian (`Search`) dan tombol "Add Assessment" dirender tepat di atas `RCMTable`.

### 3. Transactional API Endpoint on Cloudflare Workers
**Keputusan:** Endpoint `POST /api/rcm-matrix/verification-design` akan membungkus seluruh insert (`rcms` (opsional), `controls`, `rcm_controls`, dan `tod_evaluations`) dalam satu transaksi database Drizzle.
**Rasional:** Mencegah terjadinya data yatim-piatu (orphaned data) atau inkonsistensi referensi jika salah satu operasi insert gagal di tengah jalan.

## Risks / Trade-offs

- **[Risk]** Pembuatan RCM baru secara manual dari dialog ini dapat menyebabkan duplikasi Proses atau Sub-Proses jika pengguna salah mengetik nama proses yang sudah ada.
  → **Mitigation:** Sangat disarankan untuk memilih RCM yang sudah ada terlebih dahulu melalui pencarian Combobox. Input manual hanya digunakan sebagai alternatif terakhir.
- **[Risk]** Penambahan data ad-hoc ini melewati jalur Change Management (Lini 1 ke Lini 2) yang diatur oleh Lampiran 6 untuk data RCM operasional.
  → **Mitigation:** Karena fitur ini dibuat untuk verifikasi rancangan Lini 2, perubahan status RCM/Kontrol baru ini langsung diset ke "Active"/"Approved" oleh Lini 2/Admin secara langsung karena Lini 2 adalah verifikator akhir.
