## ADDED Requirements

### Requirement: Auto-detect Benchmark Value dari GL Data

Sistem SHALL auto-detect dan calculate benchmark value dari uploaded GL data berdasarkan mapping rules.

**Mapping Rules:**
- Pre-Tax Income: FSLI codes 6480000, 6490000, 6510000 (Laba/Rugi)
- Revenue: FSLI code 6010000 (Pendapatan)
- Assets: FSLI codes 1010100, 1010200, 1011000 (Kas, Piutang, Persediaan, Aset)
- Equity: FSLI codes 3010100, 3010200 (Modal, Ekuitas)

**Fallback:** Account name pattern matching jika FSLI code tidak ada

#### Scenario: Auto-populate Pre-Tax Income
- **WHEN** user selects "Pre-Tax Income" sebagai benchmark
- **AND** GL data sudah diupload
- **THEN** sistem auto-populate Benchmark Value dengan sum dari Laba/Rugi accounts

#### Scenario: FSLI code matching
- **WHEN** GL data contains Kode_FSLI
- **THEN** sistem prioritize FSLI code matching untuk benchmark calculation

#### Scenario: Account name pattern matching
- **WHEN** FSLI code tidak tersedia
- **THEN** sistem use account name pattern matching sebagai fallback

### Requirement: Real-time Benchmark Recalculation

Sistem SHALL recalculate benchmark value real-time saat user ganti benchmark category.

#### Scenario: Benchmark category change
- **WHEN** user changes benchmark dari "Pre-Tax Income" ke "Revenue"
- **THEN** sistem recalculate Benchmark Value dengan Revenue accounts
