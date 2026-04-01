## Why

Saat ini materiality calculation di ScopingPage memiliki 2 masalah utama: (1) Benchmark Value harus diinput manual padahal data GL sudah diupload, (2) Overall Materiality (OM) hanya display-only tanpa opsi manual adjustment. Ini menyulitkan user yang ingin auto-populate dari GL data atau adjust OM berdasarkan professional judgment.

## What Changes

- **Auto-populate Benchmark dari GL Data**: Sistem akan auto-detect dan populate benchmark value berdasarkan akun GL yang sudah diupload
- **GL Account Mapping**: Mapping GL accounts ke benchmark categories (Pre-Tax Income, Revenue, Assets, Equity)
- **OM Manual Override**: User dapat manual adjust Overall Materiality setelah auto-calculation
- **Smart Suggestions**: Sistem suggest benchmark value berdasarkan uploaded GL data
- **Real-time Recalculation**: OM dan PM auto-recalculate saat benchmark atau percentage berubah

## Capabilities

### New Capabilities

- `gl-benchmark-mapping`: Auto-detect benchmark value dari uploaded GL data berdasarkan account mapping
- `om-manual-override`: Manual adjustment untuk Overall Materiality dengan audit trail
- `benchmark-suggestions`: Smart suggestions untuk benchmark value berdasarkan GL composition

### Modified Capabilities

- `materiality-calculation`: Enhanced dari auto-calculate only menjadi hybrid (auto + manual override)
- `scoping-workflow`: Integration point antara GL upload dan materiality calculation

## Impact

- **ScopingPage.tsx**: Major changes di materiality calculation form
- **GLDataIntake**: Integration point untuk extract benchmark data dari GL
- **compliance-utils.ts**: Add benchmark mapping functions
- **User Workflow**: Lebih streamlined - upload GL → auto-populate → adjust if needed → calculate
- **Data Flow**: GL data → Benchmark detection → Materiality calculation
