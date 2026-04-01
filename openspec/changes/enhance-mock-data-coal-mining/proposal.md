## Why

Mock data yang ada saat ini masih generic dan tercampur antara berbagai industri (P2P, R2R, Oil & Gas). Untuk demo yang lebih fokus dan realistis, perlu mock data yang konsisten dengan konteks BUMN pertambangan batubara (coal mining) sesuai SK-5/DKU.MBU/11/2024 Lampiran 2 - Industri Mineral dan Batubara.

## What Changes

- **REPLACE**: Semua mock data existing akan ditimpa dengan coal mining specific data
- **New Entity**: PT Batubara Nusantara Sejahtera (single mining entity - open-pit coal mining)
- **New RCM**: 8 proses bisnis pertambangan batubara dengan BPM diagrams
- **New Controls**: 25-30 controls (automated, manual, MRC, ITGC)
- **New GL Data**: 50-60 accounts specific untuk coal mining
- **New Deficiencies**: 5-8 deficiency scenarios realistic untuk mining industry
- **New Risk Library**: 15-20 risks specific untuk Industri Mineral dan Batubara
- **BPM Diagrams**: 5-6 workflow diagrams dalam React Flow format

## Capabilities

### New Capabilities

- `coal-mining-mock-data`: Comprehensive mock data untuk single coal mining entity
- `bpm-workflow-templates`: Pre-built BPM diagrams untuk revenue, production, procurement cycles
- `mining-risk-library`: Risk library specific untuk Industri Mineral dan Batubara

### Modified Capabilities

None - ini replace full mock data, tidak ada modification

## Impact

- **File Changed**: `shared/mock-data.ts` (full replace)
- **BREAKING**: Semua existing mock data akan hilang (generic P2P, R2R, Oil & Gas)
- **User Experience**: Demo lebih fokus dan realistis untuk coal mining context
- **SK-5 Compliance**: Data selaras dengan Lampiran 2 - Industri Mineral dan Batubara
- **Demo Readiness**: Simplified numbers untuk mudah diingat saat presentasi
