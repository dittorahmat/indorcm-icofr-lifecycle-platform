## Why

Tabel modul RCM (TLC, ELC, ITGC) saat ini terlalu padat (data-heavy), sulit dibaca karena *horizontal scroll* berlebih, dan tidak konsisten. Hal ini menghambat efisiensi audit BUMN sesuai standar Regulation SK-5/DKU.MBU/11/2024. Perubahan ini dilakukan untuk meningkatkan keterbacaan (readability) dan kenyamanan pengguna.

## What Changes

- Implementasi desain "Minimalist Zebra" pada semua tabel RCM.
- Penggunaan "Header Grouping" untuk kolom-kolom teknis.
- Standardisasi ukuran font tabel dan padding untuk meningkatkan *data density* yang nyaman.
- Penyederhanaan elemen visual (menghapus dekorasi yang tidak perlu).

## Capabilities

### New Capabilities
- `rcm-ui-refresh`: Peningkatan estetika dan *usability* tabel data RCM.

### Modified Capabilities

## Impact

- `src/pages/rcm/`: RCMTLCPage, RCMELCPage, RCMITGCPage.
- `src/components/ui/table`: Potensi penyesuaian gaya tabel dasar.
