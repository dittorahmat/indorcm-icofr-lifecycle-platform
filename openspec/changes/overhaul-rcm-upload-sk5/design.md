## Context

Saat ini, `SmartImportWizard` menggunakan satu endpoint dan satu logika parser untuk menangani upload CSV RCM. Logika ini sangat kaku dan hanya mendukung format TLC sederhana. Regulasi SK-5/2024 menuntut detail metadata yang jauh lebih dalam (asersi, prinsip COSO, aplikasi) yang berbeda-beda strukturnya antara TLC, ELC, dan ITGC.

## Goals / Non-Goals

**Goals:**
- Implementasi 3 template CSV/XLSX yang sesuai 100% dengan Lampiran 5 SK-5 BUMN.
- UI Wizard yang memungkinkan pemilihan tipe RCM (ELC/TLC/ITGC).
- Parser backend yang mampu melakukan normalisasi data (Y/T ke boolean, string ke array ID).
- Menyediakan file sampel demo yang valid.

**Non-Goals:**
- Otomasi mapping AI (saat ini fokus pada struktur template baku).
- Fitur ekspor RCM ke Excel (fokus pada impor).

## Decisions

### 1. Strategi Parser: Polymorphic Parsing
- **Keputusan**: Menggunakan satu fungsi `parseRCMFile` yang menerima parameter `type` (ELC|TLC|ITGC).
- **Rasional**: Struktur database (`controls` dan `rcms`) cukup fleksibel untuk menampung ketiganya, namun skema validasi CSV sangat berbeda. Penggunaan `Zod` skema yang berbeda per tipe akan mempermudah validasi.
- **Alternatif**: 3 endpoint terpisah. (Ditolak karena akan menambah kompleksitas routing backend).

### 2. Normalisasi Boolean (Y/T)
- **Keputusan**: Seluruh kolom "Ya/Tidak" di CSV akan menggunakan standar "Y" atau "T" (Case Insensitive).
- **Rasional**: Memudahkan pengguna yang terbiasa dengan format manual Excel BUMN.

### 3. Penanganan Prinsip COSO di ELC
- **Keputusan**: Di CSV, pengguna mengisi satu kolom `COSO_Prinsip` dengan nilai dipisahkan koma (misal: "1, 2, 5").
- **Rasional**: Jauh lebih ramah pengguna daripada menyediakan 17 kolom boolean terpisah di file Excel.

## Risks / Trade-offs

- [Risk] Pengguna salah memilih tipe RCM saat upload -> [Mitigation] Tambahkan validasi header CSV. Jika header tidak cocok dengan tipe yang dipilih, sistem menolak proses di awal.
- [Risk] No GL tidak ditemukan saat upload TLC/ITGC -> [Mitigation] Tampilkan error log yang jelas per baris (Row level error reporting).
