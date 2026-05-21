# Panduan Peragaan (Demo Guide) - Smart Migration Feature

Gunakan kedua file di folder ini untuk mendemokan kecanggihan AI dalam fitur migrasi IndoGRC Pro.

## 1. Demo Ingesti Trial Balance (TB)
**File**: `sample_tb_migration.csv`
**Hal yang ditonjolkan**:
*   **Multi-Entity**: Perhatikan ada `BSN-01` (Site) dan `BSN-02` (HQ). AI akan otomatis memisahkan data ini.
*   **Intercompany Detection**: Akun "Piutang Usaha PT PLN" akan dideteksi AI sebagai **Pihak Berelasi BUMN** (SK-164).
*   **Semantic Mapping**: Nama akun seperti "Duit di Bank" atau "Petty Cash" akan otomatis terpetakan ke FSLI standar Holding.

## 2. Demo Ingesti Risk Control Matrix (RCM)
**File**: `sample_rcm_migration.csv`
**Hal yang ditonjolkan**:
*   **Non-Standard Headers**: Header menggunakan bahasa Indonesia campuran ("Proses Bisnis", "Frekuensi"). AI akan otomatis melakukan *Smart Header Mapping*.
*   **Value Normalization**: 
    *   "Tiap ada transaksi" $\rightarrow$ `Ad-hoc`
    *   "Setiap 6 bulan" $\rightarrow$ `Semi-Annual`
*   **AI Guessing (Metadata)**: 
    *   Aktivitas "Opname stok fisik" akan memicu AI untuk menebak Asersi: **Existence** (Keberadaan).
    *   Aktivitas "Manajer menyetujui" akan memicu AI untuk menebak Tipe: **Preventive** dan Nature: **Manual**.
*   **Visual Warning**: Perhatikan *highlight* oranye pada kolom Asersi (yang tidak ada di CSV) untuk menunjukkan di mana AI memberikan saran.

## 3. Demo Cross-Check Dashboard
Setelah kedua file di-upload, tunjukkan bagaimana sistem mendeteksi jika ada akun besar di TB yang belum memiliki kontrol di RCM (misal: Akun Pendapatan di BSN-02 yang sangat besar).
