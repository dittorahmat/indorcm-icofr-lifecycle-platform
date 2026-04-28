## Context
Audit ICOFR mewajibkan pemantauan vendor. Perlu sistem sejarah laporan dan penilaian auditor (Lini 2).

## Goals
- Database Vendor & Laporan SOC persisten.
- Form penilaian 7-point mandatori sesuai SK-5.
- Link opsional Laporan SOC ke Library Aplikasi.

## Decisions
- DB: `vendors` (OrgId), `soc_reports` (VendorId, Dates), `soc_evaluations` (7 booleans).
- Status dihitung di API: `Expired` jika hari ini > `periodEnd`.
- **UI Layout**: Tab "Significant Applications" diletakkan di urutan pertama untuk prioritas operasional, diikuti oleh "SOC Monitoring".
- **Dialog Components**: Pemisahan input data ke dalam `AddVendorDialog` dan `AddSOCReportDialog` untuk kejelasan alur kerja.
