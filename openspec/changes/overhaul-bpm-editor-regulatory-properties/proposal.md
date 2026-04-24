# Proposal: Overhaul BPM Editor Regulatory Properties

## Why
Model "lookup" (pencarian) Risiko dan Kontrol yang lama tidak sesuai dengan kebutuhan kepatuhan ICOFR terbaru. Berdasarkan mandat user dan Regulasi **SK-5/2024**, setiap Risiko dan Kontrol harus bersifat unik untuk setiap aktivitas proses bisnis guna memastikan *audit trail* yang presisi. Selain itu, interface lama terlalu sempit untuk menampung metadata kompleks seperti tabel IPO (TLC) dan pemetaan 17 Prinsip COSO (ELC) yang kini diwajibkan dalam format matriks horizontal.

## What Changes
- **Enforced Uniqueness**: Setiap node mendefinisikan Risiko dan Kontrol-nya sendiri secara unik (one-to-one mapping).
- **Auto-Generated Identifiers**: Implementasi ID otomatis (R-001, C-001) untuk mempermudah pelacakan.
- **Standalone Property Panel**: Menggunakan `Sheet` (Drawer) luas yang mendukung tabulasi:
    - **Properties**: Input metadata regulasi (TLC, ELC, ITGC).
    - **History**: Menampilkan log perubahan (Lampiran 6) spesifik untuk entitas tersebut.
- **Regulatory Matrix Evolution**: 
    - **TLC Matrix**: Pemetaan IPO dan asersi laporan keuangan.
    - **ELC Matrix (Lampiran 5 a)**: Refactor total ke layout horizontal dengan Kontrol sebagai Baris dan 17 Prinsip COSO sebagai Kolom.
- **Glossary Tooltips**: Integrasi deskripsi prinsip COSO dari Lampiran 1 langsung pada header matriks dan form.
- **Multi-Subsidiary Filtering**: Dukungan filter anak perusahaan pada level matriks untuk pelaporan konsolidasian.

## Goals
1. Menghilangkan redundansi dan ambiguitas data Risiko/Kontrol di seluruh siklus ICOFR.
2. Memastikan seluruh metadata regulasi Lampiran 5 (a, b, c) dapat diinput dari editor visual dan muncul otomatis di matriks.
3. Sinkronisasi audit trail yang presisi (Lampiran 6) antara editor visual dan log perubahan.
4. Optimalisasi performa loading matriks menggunakan *filtered endpoints* dan *frontend mapping*.
