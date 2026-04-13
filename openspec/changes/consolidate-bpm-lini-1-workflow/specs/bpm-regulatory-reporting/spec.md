# Spec: BPM Regulatory Reporting

## Purpose
Otomatisasi dokumentasi kepatuhan untuk pemeliharaan BPM (Lampiran 6) dan output diagram proses (Lampiran 4) sesuai SK-5/2024.

## Requirements
1.  **Cetak Lampiran 4 (BPM Document)**:
    - Menghasilkan PDF berisi header (Kementerian/BUMN info).
    - Menampilkan diagram proses bisnis (visual) dan narasi langkah-langkah di bawahnya.
    - Kolom output harus mencakup: No, Aktivitas, Risiko, Pengendalian, Asersi, dan Aplikasi.
2.  **Log Perubahan (Lampiran 6)**:
    - Menyimpan log perubahan setiap kali Manager melakukan "Approve" atas draf Staff.
    - Log harus berisi: Tanggal, User (Pelaksana), Data Sebelum, Data Sesudah, dan User (Pemberi Persetujuan).
    - Log harus dapat diakses melalui tab khusus di dalam BPM Modal.
3.  **Digital Sign-off (Preview)**:
    - Preview tanda tangan digital dari CFO/Manajer Departemen pada dokumen cetak PDF.

## UI/UX Standards
- Tombol "Print Lampiran 4" berwarna biru mencolok.
- Tampilan tabel log yang bersih dengan fitur filter berdasarkan tanggal.
- Format PDF harus menggunakan font standar perusahaan (Sans-serif/Arial/Inter) dengan ukuran minimal 10pt.

## Logic Rules
- Log perubahan hanya dicatat jika ada perbedaan (diff) antara draf yang disetujui dengan data `Approved` sebelumnya.
- Hanya Manager dan Lini 2 yang dapat melihat keseluruhan log riwayat; Staff hanya melihat log departemennya sendiri.
