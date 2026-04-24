# Design: Regulatory Property Panel & Unique Mapping

## Architecture

### 1. Component Structure
- **RegulatoryPropertySheet.tsx**: Komponen utama menggunakan `Sheet` (shadcn/ui) dengan sistem `Tabs`:
    - **Properties Tab**: Menampilkan `TLCForm`, `ELCForm`, atau `ITGCForm` berdasarkan pilihan klasifikasi.
    - **History Tab**: Melakukan lazy-loading `EntityHistoryList` yang mengambil data `/api/changelogs?entityId={id}`.
- **Matrix Architecture**:
    - **TLC (Transactional)**: Orientasi baris-per-risiko-kontrol dengan grid input langsung.
    - **ELC (Entity Level)**: Orientasi horizontal (Lampiran 5 a). Menggunakan `sticky` columns untuk referensi kontrol agar navigasi 17 kolom COSO tetap nyaman.

### 2. Data & Performance Strategy
- **Filtered Common Endpoints**: Diputuskan menggunakan endpoint tunggal dengan query parameter (e.g., `/api/controls?level=ELC`) daripada specialized endpoints dengan database joins.
- **Frontend Enrichment**: Nama perusahaan/subsidiary dipetakan di sisi client menggunakan data `organizations` dari cache (TanStack Query) untuk menjamin kecepatan load instan (< 100ms).
- **Localization Mapping**: Deskripsi prinsip COSO disimpan di `rcm.json` kunci `coso_tooltips` untuk memudahkan integrasi tooltip di berbagai komponen UI.

### 3. Double-Layer Safety Mechanism (UnSavedChanges)
- **Internal Guard**: Hook `useUnsavedChanges` memantau state `isDirty`. Jika user mencoba navigasi internal (SPA) tanpa menyimpan, dialog konfirmasi akan muncul.
- **External Guard**: Event listener `beforeunload` menangkap aksi tutup tab atau refresh browser.

### 4. Database Mapping
- `controls`: Menyimpan metadata utama termasuk `coso_principles` (jsonb array) dan `level`.
- `rcm_controls`: Junction table yang menyimpan metadata spesifik untuk relasi risiko-kontrol tertentu (one-to-one mapping per node).
- `audit_logs`: Mencatat snapshot perubahan data dengan flag `isRegulatory: true` untuk keperluan Lampiran 6.
