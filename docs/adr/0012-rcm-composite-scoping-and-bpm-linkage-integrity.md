# ADR 0012: RCM Composite Scoping, Ingestion Validation, and BPM Linkage Integrity

## Status
Accepted

## Context
Regulasi Kementerian BUMN SK-5/DKU.MBU/11/2024 mewajibkan dokumentasi Matriks Risiko dan Pengendalian (RCM) yang mencakup Transaction Level Controls (TLC, Lampiran 5 b), Entity Level Controls (ELC, Lampiran 5 a), dan IT General Controls (ITGC, Lampiran 5 c).

Pada implementasi penautan kontrol ke diagram alir Business Process Mapping (BPM, Lampiran 3), timbul beberapa tantangan dan potensi ambiguitas data:
1. **Peluang Tabrakan Referensi Langkah (`Ref_Langkah_BPM`)**: Format penomoran langkah dalam dokumen SOP standar BUMN berbentuk angka urut lokal per sub-proses (misal `1.1`, `1.2`, `1.3`). Nomor ini berulang di hampir seluruh sub-proses bisnis yang berbeda.
2. **Ketiadaan Teks Nama Aktivitas BPM di Regulasi SK-5 Fisik**: Format tabel cetak Lampiran 5b hanya menyediakan kolom `Ref_Langkah_BPM` tanpa kolom eksplisit nama kotak/simpul aktivitas alur, sehingga sistem kesulitan memvalidasi keselarasan semantik antara kontrol dan langkah alur jika terjadi salah ketik nomor referensi atau pembuatan simpul diagram baru.
3. **Impor Bulk di Tingkat Matriks Global (`/rcm/tlc`)**: Pengunggahan file spreadsheet di tingkat matriks global tidak memiliki konteks diagram alir tunggal yang sedang aktif dibuka.
4. **Kardinalitas Hubungan Langkah dan Kontrol**: Dalam praktik audit kepatuhan, satu langkah proses bisnis dapat dimitigasi oleh lebih dari satu aktivitas pengendalian (relasi 1:N).

## Decision

1. **Composite Scoping Hierarchy (`Proses + Sub-proses + Ref_Langkah`)**:
   - Sistem **TIDAK** mengubah penomoran pengguna menjadi kode global artifisial di template (tetap mendukung nomor natural seperti `1.2` sesuai Lampiran 5b).
   - Keunikan dan isolasi data dijamin secara komposit oleh sistem melalui hierarki:
     $$\text{Informasi\_Proses\_Bisnis} \to \text{Informasi\_Sub\_proses\_Bisnis} \to \text{Ref\_Langkah\_BPM}$$
   - Database mengikat kontrol ke tabel `bpm_processes` spesifik, dan penautan visual mengikat ke tabel `bpm_node_rcms` menggunakan Foreign Key `(diagramId, nodeId, rcmId)`. Kontrol sub-proses A tidak akan pernah tertukar atau menempel ke diagram sub-proses B.

2. **Dukungan Kolom Opsional `Nama_Langkah_BPM` (Graceful Enrichment)**:
   - Template spreadsheet dan parser diperkaya dengan kolom opsional: `Nama_Langkah_BPM` (alias: `Aktivitas_BPM`, `Nama_Langkah_Alur`).
   - Jika kolom ini diisi oleh pengguna, sistem menggunakannya untuk memverifikasi keselarasan semantik terhadap teks label simpul diagram BPM (`matchesStepRef`) dan sebagai nama dasar ketika simpul BPM baru dibuat (`+ Buat Node`).
   - Jika kolom ini kosong, parser tetap 100% kompatibel dengan format baku SK-5 dengan mengandalkan token-matching semantik antara nama/deskripsi kontrol dengan label simpul BPM.

3. **Perilaku Impor Global & Unmapped Palette**:
   - Pengunggahan file RCM dari halaman Matriks Global (`/rcm/tlc`) mencocokkan langkah kontrol hanya ke diagram BPM yang sudah ada dan aktif di database.
   - Jika diagram alir untuk sub-proses bersangkutan belum dibuat, kontrol disimpan aman di database dengan status `unmapped` dan disajikan dalam *Unmapped Palette* ketika kanvas BPM sub-proses tersebut dibuka oleh Lini 1. Sistem dilarang membuat diagram alir kosong secara diam-diam (*silent generation*).

4. **Kardinalitas 1:N (Satu Langkah Banyak Kontrol)**:
   - Sistem mengizinkan beberapa baris RCM yang berbeda merujuk ke nomor `Ref_Langkah_BPM` yang sama di sub-proses yang sama, sepanjang kode unik kontrol (`CTRL-XXX`) berbeda.

5. **Validasi Ingestion Ketat**:
   - Setiap baris yang mencantumkan `Ref_Langkah_BPM` wajib memiliki `Informasi_Sub_proses_Bisnis` yang valid.
   - Ingestion wizard menampilkan peringatan validasi pada Langkah 2 jika terdapat baris yang tidak lengkap sebelum komit ke database.

## Consequences
- Integritas data RCM dan BPM terlindungi dari tabrakan nomor urut antar sub-proses.
- Format file impor tetap patuh pada regulasi Kementerian BUMN SK-5/DKU.MBU/11/2024 sekaligus ramah automasi kanvas diagram alir visual.
- Memperjelas siklus hidup kontrol audit yang belum memiliki diagram alir melalui mekanisme *Unmapped Palette*.
