## Why
Realisasi fitur SOC Monitoring dari data mock menjadi data persisten untuk mematuhi kewajiban evaluasi pihak ketiga sesuai Juknis SK-5/2024.

## What Changes
- Tabel database baru: `vendors`, `soc_reports`, `soc_evaluations`.
- API CRUD untuk Vendor dan Laporan SOC.
- Form evaluasi 7 kriteria kepatuhan (Halaman 40 Juknis).
- Kalkulasi otomatis status "Expired" laporan.

## Capabilities
### New Capabilities
- `vendor-management`: Kelola daftar vendor per entitas.
- `soc-compliance-tracking`: Pantau kepatuhan laporan SOC 1 Tipe 2.

## Impact
- `worker/db/schema.ts`: Skema DB baru.
- `src/pages/rcm/SOCMonitoringPage.tsx`: Integrasi data dinamis.
