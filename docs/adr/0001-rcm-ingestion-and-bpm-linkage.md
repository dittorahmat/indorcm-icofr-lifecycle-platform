# ADR 0001: RCM Ingestion Engine & BPM Control Linkage Architecture

## Status
Accepted

## Context
Regulasi SK-5/DKU.MBU/11/2024 mewajibkan dokumentasi matriks risiko dan pengendalian (RCM) yang mencakup 3 jenis:
1. Transaction Level Control (TLC) - Lampiran 5 b
2. Entity Level Control (ELC) - Lampiran 5 a
3. IT General Control (ITGC) - Lampiran 5 c

Sebelumnya, pengunggahan RCM tercampur di `SmartImportWizard` (yang seharusnya hanya untuk Trial Balance/Scoping) dan `ImportPage.tsx` yang belum terintegrasi dengan endpoint backend. Selain itu, penautan kontrol ke diagram alur BPM (`bpm_node_rcms`) harus dilakukan satu per satu secara manual.

## Decision
1. **Pemisahan Tanggung Jawab & Dekomposisi Antarmuka**:
   - Menghapus opsi pengunggahan RCM dari `SmartImportWizard` pada modul Scoping agar terfokus penuh pada Ingestion Trial Balance / General Ledger.
   - Mengarahkan `ImportPage.tsx` ke wizard import terpadu atau menonaktifkan stub yang tidak terpakai.
2. **Penyediaan Reusable Engine `<RCMImportWizardModal />` di Dua Titik Masuk**:
   - **BPM Editor Toolbar**: Impor kontekstual per sub-proses dengan rekonsiliasi visual langsung ke simpul diagram aktif.
   - **RCM TLC Page Header**: Impor bulk multi-subproses untuk tahun fiskal berjalan.
3. **Template Standar SK-5 Lampiran 5**:
   - Menyediakan unduhan template resmi Excel (.xlsx / .csv) untuk TLC, ELC, dan ITGC.
4. **Mekanisme Rekonsiliasi Otomatis (Auto-Link)**:
   - Pencocokan berbasis kolom `Ref_Langkah_BPM` atau kesamaan teks semantik dengan label simpul BPM.
   - Menyediakan dialog rekonsiliasi manual interaktif: kontrol yang tidak bertaut dapat dialokasikan ke simpul yang dipilih, dimasukkan ke panel *Unmapped Controls*, atau dibuatkan simpul baru secara otomatis.
5. **Integritas Transaksi Backend**:
   - Endpoint `POST /api/rcm/import` memproses batch `rcms`, `controls`, `rcm_controls`, dan `bpm_node_rcms` dalam satu transaksi database PostgreSQL.

## Consequences
- Siklus hidup data RCM menjadi sepenuhnya konsisten dengan regulasi BUMN.
- Beban kognitif pengguna saat melakukan scoping Trial Balance berkurang.
- Keterhubungan antara diagram proses bisnis visual dan kontrol audit menjadi otomatis dan dapat diaudit secara transparan.
