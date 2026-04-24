# Proposal: Overhaul BPM Editor Regulatory Properties

## Why
Model "lookup" (pencarian) Risiko dan Kontrol yang saat ini ada di `BPMEditor.tsx` tidak sesuai dengan kebutuhan kepatuhan ICOFR terbaru. Berdasarkan mandat user dan Regulasi **SK-5/2024**, setiap Risiko dan Kontrol harus bersifat unik untuk setiap aktivitas proses bisnis guna memastikan *audit trail* yang presisi. Selain itu, interface saat ini terlalu sempit untuk menampung metadata kompleks seperti tabel IPO (TLC) dan pemetaan 17 Prinsip COSO (ELC).

## What Changes
- **Enforced Uniqueness**: Menghapus fitur pencarian Risiko/Kontrol global. Setiap node akan mendefinisikan Risiko dan Kontrol-nya sendiri secara unik.
- **Auto-Generated Identifiers**: Implementasi ID otomatis (running number) untuk Risiko dan Kontrol (e.g., R-001, C-001).
- **Standalone Property Panel**: Memindahkan UI Properties dari *slider* samping ke komponen `Sheet` (Drawer) yang lebih luas.
- **Dynamic Regulatory Forms**: Penambahan form dinamis berdasarkan klasifikasi (TLC, ELC, ITGC):
    - **TLC**: Tabel IPO (C, A, V, RA) dengan dropdown Y/N.
    - **ELC**: Pemetaan 17 Prinsip COSO.
    - **ITGC**: Penyiapan dummy domain dan asersi IT.
- **Auditability**: Penggantian Toggle Switch menjadi Dropdown (Yes/No) yang lebih formal dan penyiapan sistem snapshot untuk *audit trail*.

## Goals
1. Menghilangkan redundansi dan ambiguitas data Risiko/Kontrol.
2. Memastikan seluruh metadata regulasi Lampiran 5 (a, b, c) dapat diinput langsung dari editor visual.
3. Sinkronisasi otomatis data editor dengan halaman Matriks RCM (TLC & ELC).
