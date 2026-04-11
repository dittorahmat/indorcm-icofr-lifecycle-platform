# Proposal: BPM Spreadsheet Workflow & Sidebar Refactor

## Business Case
Implementasi modul "BPM" baru yang memungkinkan pemetaan proses bisnis secara mendalam di level transaksi, sesuai dengan layout standar Lampiran SK-5/2024. Fitur ini menyatukan hasil identifikasi akun signifikan (Scoping) dengan detail aktivitas pengendalian dalam bentuk spreadsheet yang editable dan terintegrasi dengan diagram visual.

## Goals
1.  **Sidebar Realignment:** Mengubah "Select BPM" menjadi "Control Self Assessment" dan menambah menu "BPM" baru.
2.  **Cascading Header Filter:** Membangun filter header (FSLI -> Nomor GL) yang hanya mengambil data akun "Significant" dari hasil Scoping.
3.  **BPM Process Management:** Fitur untuk membuat dan mengelola list Judul Proses BPM per akun GL.
4.  **Excel-like Worksheet:** Implementasi tabel editable 16 kolom (15 kolom PDF + 1 action Workflow) dengan fitur auto-save.
5.  **Regulatory Compliance (Change Log):** Implementasi pencatatan otomatis log perubahan sesuai format Lampiran 6 SK-5/2024.
6.  **Application Integration:** Dropdown aplikasi signifikan yang terhubung ke Master Data dengan kemampuan menambah aplikasi baru secara langsung.

## Proposed Changes

### 1. Sidebar & Routing (`src/components/app-sidebar.tsx`, `src/main.tsx`)
- Rename `/csa` label menjadi "Control Self Assessment".
- Tambahkan route baru `/bpm` dengan label menu "BPM".

### 2. Data Model (`shared/types.ts`)
- **`Control` & `RCM`**: Tambahkan field tambahan jika diperlukan untuk menampung 15 kolom (Lokasi, Risiko Fraud, IPO, dll).
- **`BPMProcess`**: Entitas baru untuk menyimpan "Judul Proses" (misal: Penerimaan Setoran) yang menaungi baris-baris tabel.
- **`ChangeLog`**: Pastikan schema mendukung penyimpanan nilai `oldValue` dan `newValue`.

### 3. UI: BPM Page Header & List
- Dropdown FSLI (Searchable) -> Filter by Scoping status "Significant".
- Dropdown Nomor GL (Searchable) -> Cascading dari FSLI terpilih.
- List View untuk "Judul Proses BPM" dengan tombol "Create BPM".

### 4. UI: Spreadsheet Worksheet (`BPMWorksheet.tsx`)
- Tabel menggunakan `@tanstack/react-table`.
- **Kolom Kunci:** Informasi Proses (Lvl 1 & 2), Sub-Proses, Lokasi (Manual Input), Risiko Fraud (Dropdown Y/T), IPO, Asersi, Tipe Pengendalian, Sifat Pengendalian, Aplikasi.
- **BPM Workflow Column:** Tombol "Create/View" yang membuka editor React Flow. Diagram disimpan per **Sub-Proses**.
- **Auto-Save:** Debounced function untuk menyimpan perubahan sel ke backend.

### 5. Backend Logic (`worker/user-routes.ts`)
- Endpoint untuk mengambil daftar akun signifikan.
- Endpoint CRUD untuk BPM Process dan baris Control di dalamnya.
- **Audit Logic:** Setiap `PUT` request ke sel tabel wajib memicu pembuatan entry di `ChangeLogEntity`.

## Compliance Alignment
- **SK-5/2024 Lampiran 6:** Setiap perubahan proses bisnis dan pengendalian wajib didokumentasikan dalam Log Perubahan.
- **SK-5/2024 Tabel 2:** Lini 2 bertanggung jawab menetapkan dan mendokumentasikan proses bisnis.

## Risks & Mitigations
- **Risk:** Perubahan masif pada tabel membuat performa berat.
- **Mitigation:** Gunakan virtualized rows jika data sangat besar dan sistem debouncing pada auto-save.
