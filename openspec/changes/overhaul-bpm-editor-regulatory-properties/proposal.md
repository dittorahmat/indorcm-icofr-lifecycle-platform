# Proposal: Overhaul BPM Editor Regulatory Properties

## Why
Model "lookup" Risiko dan Kontrol yang lama tidak memadai untuk auditabilitas ICOFR. Berdasarkan masukan user dan evaluasi teknis, setiap aktivitas proses bisnis harus memiliki pemetaan Risiko & Kontrol yang unik. Namun, dalam realitanya, satu aktivitas seringkali memiliki lebih dari satu risiko, atau satu risiko dimitigasi oleh beberapa kontrol. Oleh karena itu, diperlukan editor yang mendukung struktur hirarki (1:N) namun tetap menjaga keunikan data di level database guna mendukung *audit trail* yang presisi sesuai **Regulasi SK-5/2024**.

## What Changes
- **Hierarchical Mapping (1:N)**: Mendukung multiple Risiko per aktivitas, dan multiple Kontrol per risiko dalam satu tampilan terpadu.
- **Enforced Uniqueness & Auto-ID**: Menghapus fitur pencarian global. Setiap pasangan Risiko/Kontrol di-generate unik dengan ID otomatis (R-XXX, C-XXX).
- **Standalone Hierarchical Panel**: Menggunakan `Sheet` (Drawer) dengan visualisasi hirarkis (Kartu Risiko -> Nested Kartu Kontrol).
- **Dynamic Regulatory Forms**: Implementasi form otomatis untuk TLC (IPO), ELC (17 Prinsip COSO), dan ITGC (IT Domain).
- **Data Integrity & Auto-Cleanup**: Implementasi *Hard Delete* otomatis di backend untuk membersihkan data yatim saat diagram disimpan.
- **Enhanced Safety**: Penambahan *Double-Layer Safety* (UnsavedChanges guard) dan konfirmasi penutupan popup jika ada data yang belum sinkron.

## Goals
1. Mengakomodasi kompleksitas pemetaan RCM dunia nyata (1:N) tanpa mengorbankan integritas data unik.
2. Memastikan seluruh metadata regulasi Lampiran 5 (a, b, c) terisi lengkap secara visual.
3. Sinkronisasi otomatis 100% antara visual editor dengan Matriks RCM (TLC & ELC).
