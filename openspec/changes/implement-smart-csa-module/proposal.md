## Why

Modul CSA (Control Self-Assessment) saat ini hanya mendukung penyimpanan hasil evaluasi terakhir secara statis pada entitas Kontrol. Sesuai dengan **Regulasi BUMN SK-5/DKU.MBU/11/2024 Lampiran 7**, CSA harus berupa dokumen aktivitas mandiri oleh Lini Pertama yang mencakup pengujian terhadap beberapa sampel transaksi, memiliki format kertas kerja yang terstandarisasi, dan dapat dipertanggungjawabkan (auditable). 

Perubahan ini diperlukan untuk mendigitalisasi proses "self-certification" tersebut agar patuh regulasi, mendukung transparansi bukti (evidence), dan mempermudah pelaporan manajemen.

## What Changes

- **BPM Worksheet Enhancement**: Mengubah Tab CSA di `BPMWorksheet.tsx` dari form tunggal menjadi tampilan tabel riwayat CSA (List View).
- **Dynamic CSA Records**: Implementasi entitas `CSARecord` baru yang mendukung relasi 1-ke-banyak dengan `CSASample`.
- **Smart Lampiran 7 Form**: Form input dinamis yang berubah tampilan sesuai sifat kontrol (Manual/ITDM vs ITAC/Automated) sesuai standar Lampiran 7.
- **BPM Gate Confirmation**: Tahap validasi awal sebelum mengisi form CSA untuk mengonfirmasi apakah ada perubahan proses bisnis (SOP/Struktur) di periode berjalan.
- **Dynamic Attribute Questions**: Label Atribut A, B, C, D bersifat dinamis ditarik dari data Master Kontrol (bukan label generik).
- **Validation Engine**:
    - **Frequency-based Min Sampling**: Validasi otomatis jumlah sampel minimal berdasarkan frekuensi kontrol (Tahunan, Bulanan, dst) merujuk pada Tabel 22 Regulasi SK-5.
    - **Zero Tolerance Locking**: Mengunci opsi "Efektif" jika terdapat satu saja sampel yang gagal (Attr = False).
- **Dynamic Sampling**: User dapat menambah/menghapus baris sampel pengujian secara fleksibel di dalam form CSA.
- **PDF Generation**: Fitur cetak dokumen CSA dengan format yang identik dengan Lampiran 7 PDF regulasi.
- **I18n Integration**: Penambahan kunci lokalisasi baru di `src/i18n/locales/` (en/id) untuk semua komponen CSA.
- **Audit Integration**: Setiap penyelesaian CSA akan mencatat entri otomatis ke sistem audit trail.

## Capabilities

### New Capabilities
- `csa-dynamic-sampling`: Kemampuan untuk melakukan pengujian berbasis sampel dinamis dan penilaian atribut (A, B, C, D) sesuai regulasi.
- `regulatory-pdf-export`: Engine untuk men-generate dokumen PDF patuh regulasi berdasarkan data aktivitas di aplikasi.

### Modified Capabilities
- `csa-workflow`: Mengubah alur kerja CSA dari *control-level property* menjadi *activity-based document*.

## Impact

- **Database**: Perubahan skema Drizzle untuk tabel `csa_records` dan penambahan tabel baru `csa_samples`.
- **API**: Endpoint baru untuk CRUD `CSARecord` dan generate PDF.
- **Frontend**: Modifikasi besar pada `CSATabContent.tsx` dan penambahan komponen UI baru untuk form Lampiran 7.
- **I18n**: Update pada `bpm.json` dan `common.json` di folder locales.
