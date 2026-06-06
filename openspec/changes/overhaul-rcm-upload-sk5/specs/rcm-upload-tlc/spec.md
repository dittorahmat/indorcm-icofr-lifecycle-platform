## MODIFIED Requirements

### Requirement: Impor RCM Transaction Level Control (TLC)
Sistem SHALL memungkinkan pengguna mengimpor data RCM TLC menggunakan file CSV dengan format 33 kolom lengkap sesuai Lampiran 5.b SK-5/2024, termasuk asersi laporan keuangan dan IPO.

#### Scenario: Berhasil impor TLC dengan asersi lengkap
- **WHEN** pengguna mengunggah file CSV TLC dengan kolom Asersi_E_O, Asersi_C, dll berisi "Y"
- **THEN** sistem menyimpan nilai tersebut ke kolom boolean yang sesuai di tabel `rcm_controls` atau `controls`.
