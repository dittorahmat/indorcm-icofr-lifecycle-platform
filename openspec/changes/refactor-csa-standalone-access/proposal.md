## Why

Saat ini logic Control Self Assessment (CSA) terikat sebagai tab di dalam `BPMModal`, sehingga user harus melalui beberapa klik (BPM Page -> Klik Sub-Proses -> Klik Tab CSA) untuk mengaksesnya. Selain itu, tidak ada akses langsung ke CSA dari navigasi utama (Sidebar). Hal ini menghambat produktivitas user (terutama Lini 1) yang perlu melakukan assessment rutin secara efisien.

Perubahan ini bertujuan untuk mendecouple CSA menjadi komponen mandiri yang dapat diakses melalui "Dua Pintu": secara kontekstual melalui modal khusus di `BPMPage` dan secara mandiri melalui halaman khusus yang terintegrasi di Sidebar.

## What Changes

- **Standalone CSA Component**: Refactor `CSATabContent.tsx` agar benar-benar independen dari state `BPMModal`.
- **New CSA Page**: Implementasi halaman `/csa` yang menampilkan dashboard assessment dan list control yang perlu di-review.
- **New CSA Modal**: Implementasi popup khusus CSA yang dipicu langsung dari klik nama sub-proses di `BPMPage`.
- **Sidebar Integration**: Menambahkan menu "Control Self Assessment" di sidebar untuk akses cepat.
- **Improved Navigation**: Update logic klik di `BPMPage` (Sub-proses klik -> CSA Modal, Action Edit icon -> BPM Modal/Worksheet).
- **Localization**: Implementasi i18n lengkap untuk seluruh workflow CSA baru.
- **Unsaved Changes**: Integrasi `UnsavedChangesDialog` pada form assessment CSA untuk mencegah kehilangan data.
- **Database Migration**: Penyesuaian skema database (jika diperlukan untuk metadata assessment tambahan) menggunakan Drizzle.

## Capabilities

### New Capabilities
- `csa-standalone`: Kemampuan untuk menjalankan workflow CSA secara mandiri di halaman khusus dengan list control universal.
- `csa-quick-access`: Integrasi akses cepat CSA melalui modal kontekstual dari daftar sub-proses BPM.

### Modified Capabilities
- `bpm-edge-visuals`: Penyesuaian navigasi dari daftar sub-proses untuk memisahkan akses RCM dan CSA.

## Impact

- **Frontend**: Modifikasi `src/pages/bpm/BPMPage.tsx`, `src/components/app-sidebar.tsx`, dan `src/main.tsx`.
- **Components**: Refactor `src/components/bpm/CSATabContent.tsx`, pembuatan `src/components/bpm/CSAModal.tsx` dan `src/pages/csa/CSAPage.tsx`.
- **I18n**: Update file JSON di `src/i18n/`.
- **Database**: Potensi migration di `drizzle/` untuk mendukung tracking status assessment yang lebih detail.
