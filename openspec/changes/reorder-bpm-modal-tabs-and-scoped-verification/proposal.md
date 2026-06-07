## Why

Penyusunan urutan tab saat ini di BPMModal kurang mengikuti alur kerja logis pengguna (execution flow). Selain itu, desain verifikasi pengujian (Verification Design) yang merupakan jembatan antara identifikasi kontrol (RCM) dan eksekusi asesmen (CSA) belum tersedia di dalam modal secara terintegrasi dan terfilter, sehingga menyulitkan pengguna untuk mereview rancangan pengujian yang spesifik untuk proses yang sedang dikerjakan.

## What Changes

- Mengatur ulang urutan tab di `BPMModal.tsx` menjadi: Lembar Kerja, Detail Transaksi, Matriks RCM, Asesmen CSA, Desain Verifikasi, dan Log Perubahan.
- Melakukan refaktor pada `VerificationDesignPage.tsx` agar mendukung props `embedded` dan `filterBpmId` untuk integrasi modal yang bersifat scoped (hanya menampilkan data terkait BPM tersebut).
- Menambahkan tab baru "Desain Verifikasi" di antara tab "Asesmen CSA" dan "Log Perubahan".
- Memperbarui file lokalisasi (`bpm.json`) untuk mendukung label tab baru dan urutan yang baru.

## Capabilities

### New Capabilities
- `scoped-verification-design`: Kemampuan untuk melihat dan mengelola desain verifikasi pengujian yang terfilter secara otomatis berdasarkan konteks BPM yang sedang dibuka.

### Modified Capabilities
- `bpm-execution-hub`: Pembaruan pada layout navigasi tab dan integrasi konten desain verifikasi yang bersifat kontekstual.

## Impact

- `src/components/bpm/BPMModal.tsx`: Perubahan struktur render tab dan penambahan import.
- `src/pages/rcm/VerificationDesignPage.tsx`: Refaktor komponen menjadi reusable (Page + Component).
- `src/i18n/locales/id/bpm.json`: Penambahan key lokalisasi baru.
- `src/i18n/locales/en/bpm.json`: Penambahan key lokalisasi baru (jika tersedia).
