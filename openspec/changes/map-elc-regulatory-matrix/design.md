## Context

Matriks ELC saat ini memiliki orientasi yang tidak standar (Prinsip sebagai baris), yang menyulitkan pembacaan saat jumlah kontrol bertambah banyak. Selain itu, *audit trail* hanya tersedia di halaman global, sehingga user sulit melacak perubahan pada satu kontrol spesifik saat sedang melakukan editing di BPM Editor.

## Goals / Non-Goals

**Goals:**
- Implementasi Matriks ELC dengan Kontrol sebagai Baris dan 17 Prinsip COSO sebagai Kolom (Lampiran 5 a).
- Integrasi Tooltip Lampiran 1 pada header kolom matriks dan form editor.
- Penambahan filter Anak Perusahaan/Organisasi pada level matriks.
- Menampilkan riwayat perubahan entitas (audit log) di dalam `RegulatoryPropertySheet`.

**Non-Goals:**
- Implementasi logika kalkulasi otomatis efektivitas (hanya fokus pada pemetaan dan metadata).
- Perubahan besar pada skema database (menggunakan kolom `coso_principles` yang sudah ada).

## Decisions

### 1. Matrix UI Architecture
- **Sticky Layout**: Menggunakan `sticky` columns pada komponen `Table` Shadcn untuk kolom "No" dan "Aktivitas Pengendalian" agar tetap terlihat saat user melakukan scroll horizontal melewati 17 kolom prinsip COSO.
- **Condensed Typography**: Menggunakan ukuran font `text-[10px]` atau `text-xs` untuk kolom prinsip guna menghemat ruang horizontal.

### 2. Localization & Glossary Mapping
- **i18n Centralization**: Deskripsi 17 prinsip dari Lampiran 1 akan disimpan dalam `src/i18n/locales/id/rcm.json` di bawah kunci `coso_tooltips`. Hal ini memudahkan pemeliharaan jika ada revisi redaksional regulasi tanpa menyentuh kode komponen.

### 3. API & Data Fetching for Audit Trail
- **On-Demand Loading**: Tab "History" pada `RegulatoryPropertySheet` akan melakukan fetch data `/api/changelogs?entityId={id}` hanya saat tab tersebut aktif (lazy loading) untuk menjaga performa.
- **Backend Filter**: Menambahkan filter `where(eq(auditLogs.entityId, entityId))` pada endpoint changelog di Cloudflare Worker.

### 4. Subsidiary Filtering
- **Zustand/Context Integration**: Menggunakan status organisasi aktif dari auth context untuk mengisi default filter anak perusahaan.

## Risks / Trade-offs

- [Tabel Terlalu Lebar] → Mitigasi: Implementasi tooltip pada header dan penggunaan icon minimalis (Check/X) untuk isian kolom prinsip.
- [Data Log Terlalu Besar] → Mitigasi: Limitasi hasil log per entitas (misal: 10-20 entri terakhir) dan implementasi pagination jika diperlukan di masa depan.
