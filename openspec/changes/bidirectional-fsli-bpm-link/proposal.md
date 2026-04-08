# Proposal: Bidirectional FSLI & BPM Linking

## Business Case
Berdasarkan **SK-5/DKU.MBU/11/2024 Poin 1.4**, penentuan proses bisnis signifikan wajib dikelompokkan berdasarkan akun laporan keuangan (FSLI) yang sesuai. Saat ini, modul *Scoping* (Financial) dan *BPM/RCM* (Operational) di aplikasi masih terpisah secara data. 

User harus mengisi ulang informasi FSLI secara manual saat membuat laporan defisiensi (Lampiran 11), yang meningkatkan risiko kesalahan data dan inefisiensi. Fitur ini akan menciptakan **Traceability Matrix** otomatis antara angka signifikan dan aktivitas pengendalian.

## Goals
-   **Bidirectional Navigation:** User dapat berpindah dari Akun Signifikan di Scoping langsung ke BPM terkait, dan sebaliknya.
-   **Contextual Linking:** Setiap *Control Point* di BPM dapat dihubungkan dengan satu atau lebih FSLI yang di-cover.
-   **Automated Reporting:** Tabel defisiensi di Lampiran 11 akan otomatis terisi dengan FSLI yang terkait melalui link kontrol tersebut.
-   **Data Integrity:** Memastikan hanya akun yang ditandai "Significant" di Scoping yang muncul sebagai pilihan di BPM.

## Proposed Changes

### 1. Data Model Updates (`shared/types.ts`)
-   Update `interface Control`: Tambahkan `fsliCodes: string[]`.
-   Update `interface SignificantAccount`: Tambahkan `relatedProcessIds?: string[]`.

### 2. UI Updates
-   **`ScopingPage.tsx`**: 
    -   Tambahkan kolom "Related Process" di tabel Akun Signifikan.
    -   Tambahkan aksi "View/Link BPM" yang membuka RCMList dengan filter tertentu.
-   **`BPMEditor.tsx`**: 
    -   Tambahkan level ke-4 pada `DrilldownPanel`: **"Affected FSLI"**.
    -   Gunakan `Select` component untuk memilih FSLI dari daftar akun signifikan (fetch via API).
-   **`RegulatoryAppendices.tsx`**:
    -   Update `Lampiran11Report` untuk melakukan join antara `Deficiency -> Control -> FSLI` alih-alih menggunakan data mock.

### 3. API Updates (`worker/user-routes.ts`)
-   Pastikan endpoint `PUT /api/controls/:id` mendukung update `fsliCodes`.

## Compliance Alignment
-   **SK-5/2024 Hal 32 (1.4.a):** Pemetaan akun signifikan ke proses bisnis.
-   **SK-5/2024 Hal 111 (Lampiran 11):** Kewajiban kolom "FSLI Terkait" pada tabel defisiensi.

## Risks & Mitigations
-   **Risk:** User bingung memilih FSLI karena jumlahnya banyak.
-   **Mitigation:** Filter dropdown di BPM hanya menampilkan akun yang sudah ditandai "Significant" di tahun fiskal berjalan.
