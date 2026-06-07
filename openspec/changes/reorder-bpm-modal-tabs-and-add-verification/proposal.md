## Why

Penyusunan urutan tab saat ini di BPMModal kurang mengikuti alur kerja logis pengguna (execution flow). Selain itu, desain verifikasi pengujian (Verification Design) yang merupakan jembatan antara identifikasi kontrol (RCM) dan eksekusi asesmen (CSA) belum tersedia di dalam modal, sehingga menyulitkan pengguna untuk mereview rancangan pengujian sebelum melakukan asesmen.

## What Changes

- Mengatur ulang urutan tab di `BPMModal.tsx` menjadi: Lembar Kerja, Detail Transaksi, Matriks RCM, Asesmen CSA, dan Log Perubahan.
- Menambahkan tab baru "Desain Verifikasi" di antara tab "Asesmen CSA" dan "Log Perubahan".
- Mengintegrasikan komponen `VerificationDesignPage` ke dalam tab baru tersebut.
- Memperbarui file lokalisasi (`bpm.json`) untuk mendukung label tab baru dan urutan yang baru.

## Capabilities

### New Capabilities
- `verification-design-integration`: Kemampuan untuk melihat dan mengelola desain verifikasi pengujian langsung dari dalam Execution Hub (BPM Modal).

### Modified Capabilities
- `bpm-execution-hub`: Pembaruan pada layout dan urutan navigasi tab untuk meningkatkan efisiensi alur kerja eksekusi.

## Impact

- `src/components/bpm/BPMModal.tsx`: Perubahan struktur render tab.
- `src/i18n/locales/id/bpm.json`: Penambahan key `verification` pada `modal.tabs`.
- `src/pages/rcm/VerificationDesignPage.tsx`: Integrasi sebagai tab content.
