## Why

Mock data OM/PM saat ini menggunakan angka statis (Rp 17.5B OM, Rp 13.125B PM) yang tidak berasal dari GL data actual. Untuk meningkatkan realisme demo, perlu update mock materiality dengan calculation berdasarkan Sample Data GL.csv yang sudah tersedia (930 rows).

## What Changes

- **Calculate Pre-Tax Income dari GL.csv**: Extract revenue, COGS, dan operating expenses dari GL accounts
- **Apply 5% benchmark**: OM = Pre-Tax Income × 5%
- **Apply 25% haircut**: PM = OM × (100% - 25%)
- **Update MOCK_MATERIALITY**: Replace static values dengan calculated values
- **Update MOCK_SCOPING**: Add significant accounts yang sesuai dengan GL.csv chart of accounts

## Capabilities

### Modified Capabilities

- `materiality-calculation`: OM/PM sekarang calculated dari GL data, bukan hardcoded

## Impact

- **File Changed**: `shared/mock-data.ts` (MOCK_MATERIALITY dan MOCK_SCOPING sections)
- **User Experience**: Materiality calculation lebih realistis dan data-driven
- **Demo Quality**: Angka OM/PM sekarang traceable ke GL data actual
- **No Breaking Changes**: Structure tetap sama, hanya values yang berubah
