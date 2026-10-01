## Why

Penentuan *Degree of Deficiency* (DoD) berdasarkan **Peraturan Menteri BUMN No. SK-5/DKU.MBU/11/2024** (Bab V Bagian 1.1 Hal. 62–65 dan Lampiran 10 Hal. 97–99) dan standar **PCAOB AS 2201** adalah proses evaluasi audit formal berjenjang yang mensyaratkan transparansi penuh, justifikasi substantif, dan bukti pendukung (data penyerta) yang dapat dipertanggungjawabkan kepada Komite Audit dan Dewan Direksi.

Saat ini antarmuka penentuan DoD di aplikasi hanya menggunakan wizard pop-up dialog dengan opsi klik *Yes/No* biner tanpa mendokumentasikan justifikasi auditor per langkah dan tanpa menyertakan bukti/data penyerta terintegrasi. Hal ini dinilai terlalu sederhana oleh pengguna institusional dan tidak memenuhi standar dokumentasi kertas kerja 24-kolom Lampiran 10 SK-5/2024.

Perubahan ini menghadirkan antarmuka **Kertas Kerja Penentuan DoD (Worksheet View)** lengkap dengan integrasi otomatis *evidence* dari modul Testing (TOD/TOE), Scoping (Materialitas), dan RCM (Compensating Controls) serta form justifikasi wajib di setiap langkah evaluasi (Kotak 1 s.d Kotak 7).

## What Changes

- **Transisi Tampilan DoD ke Kertas Kerja (Worksheet View)**: Menggantikan modal kuis sederhana dengan lembar evaluasi matriks yang mengadopsi format 24-kolom Lampiran 10 SK-5/2024.
- **Integrasi Bukti / Data Penyerta Otomatis (Evidence Context Integration)**:
  - Kotak 2 (Likelihood): Menarik ringkasan hasil pengujian sampel dari modul TOD/TOE (jumlah sampel gagal, populasi, persentase eksepsi, dan link referensi Workpaper pengujian).
  - Kotak 3 (Magnitude): Menarik saldo akun GL, exposure value temuan, dan membandingkannya secara langsung dengan threshold Performance Materiality (PM) / Overall Materiality (OM).
  - Kotak 5 (Compensating Controls): Menyediakan pemilih (*picker*) kontrol kompensasi sekunder dari RCM pada proses/asersi yang sama beserta status efektivitas pengujiannya.
  - Kotak 6 (Prudent Official Criteria): Menampilkan 5 indikator keras regulasi (fraud manajemen, restatement laporan keuangan, salah saji material berjalan yang lolos kontrol, inefektivitas pengawasan komite audit) sebagai panduan objektif.
- **Justifikasi Terstruktur per Kotak Keputusan**: Setiap kotak keputusan (Kotak 1 s.d Kotak 7) mewajibkan auditor mengisi alasan pertimbangan profesional (*auditor rationale*) sebelum kesimpulan akhir (CD, SD, atau MW) dikunci.
- **Penyimpanan Metadata Lengkap**: Memperluas skema data defisiensi untuk menyimpan rincian justifikasi per kotak, referensi bukti/workpaper, kontrol kompensasi yang dipertimbangkan, serta jejak audit penilai.

## Capabilities

### New Capabilities
- `dod-worksheet-evaluation`: Kertas kerja komprehensif penentuan Degree of Deficiency (DoD) sesuai Lampiran 10 SK-5/DKU.MBU/11/2024 dengan integrasi evidence dari testing & scoping serta justifikasi per kotak keputusan.

### Modified Capabilities
- `remediation-tracking`: Penyesuaian trigger alur evaluasi defisiensi dan penyimpanan status severity yang dihasilkan dari Kertas Kerja DoD.

## Impact

- **Frontend Components**:
  - `src/components/deficiencies/DoDWizard.tsx`: Dirombak/direfaktor menjadi `DoDWorksheetDialog.tsx` atau komponen kertas kerja modular.
  - `src/pages/deficiencies/DeficiencyBoard.tsx`: Integrasi trigger pembukaan kertas kerja DoD dengan konteks data defisiensi dan modul testing terkait.
- **Types & Schema**:
  - `shared/types.ts`: Penambahan tipe data `DoDWorksheetData`, `DoDBoxEvaluation`, `DoDEvidenceContext`.
- **Localization**:
  - `src/i18n/locales/en/deficiency.json` & `id/deficiency.json`: Penambahan string lokalisasi lengkap untuk 24 kolom Lampiran 10, label evidence, justifikasi, dan pesan validasi.
