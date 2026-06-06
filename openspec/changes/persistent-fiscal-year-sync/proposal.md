## Why

Saat ini, pilihan tahun fiskal di aplikasi bersifat transient (sementara). Setiap kali user membuka tab baru atau melakukan refresh, pilihan tahun kembali ke default (2026). Hal ini menyebabkan ketidakkonsistenan UX dan risiko kesalahan input data jika user sedang mengerjakan siklus tahun fiskal yang berbeda (misal 2024 atau 2025).

## What Changes

- Mengubah `useFiscalYearStore` agar menggunakan persistensi (localStorage).
- Menambahkan mekanisme sinkronisasi otomatis antar tab (cross-tab synchronization).
- Mengintegrasikan deteksi "Unsaved Changes" agar sinkronisasi tidak mengganggu form yang sedang diisi.
- Memastikan URL query parameter `?year=` tetap dihormati sebagai prioritas utama saat inisialisasi.

## Capabilities

### New Capabilities
- `persistent-state-sync`: Mekanisme global untuk menyimpan state aplikasi ke storage dan sinkronisasi antar tab.

### Modified Capabilities
- `global-fiscal-year-context`: Memperluas kontrak context tahun fiskal agar mendukung persistensi dan sinkronisasi.

## Impact

- `src/store/useFiscalYearStore.ts`: Logika utama penyimpanan dan sinkronisasi.
- `src/components/layout/FiscalYearSelector.tsx`: Penanganan pergantian tahun dengan konfirmasi jika ada unsaved changes.
- Kontrak navigasi di seluruh aplikasi (via query parameter).
