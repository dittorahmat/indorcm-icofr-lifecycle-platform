# Standar Format Dokumen Regulasi BUMN SK-5 (Save as PDF)

Modul generator PDF resmi di `src/lib/pdf/` menggantikan pemanggilan `window.print()` / tangkapan layar browser yang rentan memotong kolom tabel dan memunculkan elemen navigasi.

## Standar Format Wajib Dokumen SK-5
Setiap lembar kerja kepatuhan yang dicetak sebagai PDF harus memenuhi struktur berikut:

1. **Header & Identitas Resmi**:
   - Kop surat entitas BUMN (`PT BATUBARA NUSANTARA SEJAHTERA (PERSERO)`).
   - Rujukan regulasi resmi: `STANDAR DOKUMEN REGULASI BUMN SK-5/DKU.MBU/11/2024`.
   - Kode Lampiran baku (e.g. `LAMPIRAN 7A`, `LAMPIRAN 8`, `LAMPIRAN 9`, `LAMPIRAN 10`, `LAMPIRAN 11`).
   - Nomor dokumen unik terkendali dan stempel `[CONTROLLED COPY - AUDIT READY]`.

2. **Tata Letak & Tabel Berpaginasi**:
   - Orientasi proporsional: Lanskap (*Landscape*) untuk matriks banyak kolom (Lampiran 6, 8, 9, 10, dan 7A Rinci); Potret (*Portrait*) untuk Lampiran 11 dan 7A Ringkas.
   - Paginasi otomatis: Running header pada halaman 2+ dan running footer "Halaman X dari Y" di setiap halaman.

3. **Lembar Pengesahan Berjenjang (*Digital Sign-Off*)**:
   - Kotak pengesahan Lini 1 (Penyusun / Control Owner) dan Lini 2 (Penelaah / Risk Governance).
   - Khusus Lampiran 11: Lembar pengesahan Direksi/CFO lengkap dengan stempel verifikasi digital.

## Daftar Generator Resmi di `src/lib/pdf/`
- `regulatory-pdf-builder.ts`: Mesin pembangun layout dasar, header, footer, tabel berpaginasi, dan kotak tanda tangan.
- `csa-pdf-export.ts`: Ekspor Kertas Kerja CSA Lampiran 7A (Rinci per Sampel & Ringkasan Kontrol).
- `verification-pdf-export.ts`: Ekspor Lembar Evaluasi Desain 6 Pilar TOD (Lampiran 8).
- `lampiran6-9-pdf-export.ts`: Ekspor Catatan Perubahan (Lampiran 6) & Daftar Temuan (Lampiran 9).
- `lampiran10-pdf-export.ts`: Ekspor Kertas Kerja Penentuan Keparahan Defisiensi / DoD (Lampiran 10).
- `lampiran11-pdf-export.ts`: Ekspor Asesmen Manajemen & Digital Sign-off (Lampiran 11).
