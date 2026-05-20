## ADDED Requirements

### Requirement: Tampilan Header Manchester City pada BPMModal
Komponen `BPMModal` MUST menggunakan tema visual Manchester City pada bagian header, menggantikan warna Indigo gelap yang ada.

#### Scenario: Visualisasi Header BPMModal
- **WHEN** Pengguna membuka modal detail proses bisnis (BPMModal)
- **THEN** Header modal menampilkan latar belakang biru Manchester City (`#6CABDD`) dengan corak garis diagonal (`.bg-mancity-pattern`) dan teks berwarna Dark Navy (`.text-primary-foreground`) untuk keterbacaan optimal.

### Requirement: Tampilan Pemisah Baris Manchester City pada RCMGroupRow
Komponen `RCMGroupRow` MUST menggunakan tema visual Manchester City untuk baris pemisah kategori utama (`depth === 0`), menggantikan warna Slate gelap yang ada.

#### Scenario: Visualisasi Baris Pemisah RCM
- **WHEN** Tabel RCM merender baris pemisah kategori (Group Row) dengan level kedalaman 0
- **THEN** Baris tersebut menampilkan latar belakang biru Manchester City dan teks berwarna Dark Navy, serta menghilangkan border bawah yang terlalu kontras.
