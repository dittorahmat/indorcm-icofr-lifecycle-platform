## Context

**Current State:**
- MOCK_MATERIALITY menggunakan static values:
  - OM: Rp 17.5B (5% of Rp 350B Pre-Tax Income - hardcoded comment)
  - PM: Rp 13.125B (75% of OM)
  - Haircut: 25%
- MOCK_SCOPING menggunakan significant accounts yang tidak traceable ke GL.csv
- Sample Data GL.csv tersedia (930 rows) tapi tidak dimanfaatkan untuk materiality calculation

**Constraints:**
- Simple update only (Option 1 dari exploration)
- Tidak perlu parse GL.csv secara otomatis
- Manual calculation based on GL.csv sample data
- Maintain compatibility dengan existing materiality form structure

**Stakeholders:**
- Demo audience: Perlu angka yang realistic dan dapat dijelaskan
- Users: Perlu understand bagaimana OM/PM di-calculate

## Goals / Non-Goals

**Goals:**
- Calculate Pre-Tax Income dari GL.csv accounts
- Apply 5% benchmark untuk得到 OM
- Apply 25% haircut untuk得到 PM
- Update MOCK_MATERIALITY dengan calculated values
- Update MOCK_SCOPING significant accounts untuk match GL.csv chart of accounts

**Non-Goals:**
- Auto-parse GL.csv dengan script (manual calculation cukup)
- Change materiality calculation logic di form
- Add new fields atau structure changes
- Backend changes

## Decisions

### 1. GL.csv Analysis Approach

**Decision**: Manual extraction dari GL.csv sample data

**Rationale:**
- Simple update (Option 1)
- GL.csv sudah tersedia dan ter-structure dengan baik
- FSLI codes memudahkan identification of P&L accounts

**Calculation Method:**
```
Revenue (Credit balance):
- 6010000: Pendapatan (Export + Domestic)

COGS (Debit balance):
- 6020000: Harga Pokok Penjualan
- 6020500: Beban Royalty

Operating Expenses (Debit balance):
- 6030000: Beban Umum, Administrasi, Penjualan, Keuangan

Pre-Tax Income = Revenue - COGS - Operating Expenses
OM = Pre-Tax Income × 5%
PM = OM × 75% (25% haircut)
```

### 2. Significant Accounts Selection

**Decision**: Select top accounts by balance dari GL.csv

**Criteria:**
- Balance > PM threshold (quantitative)
- Qualitative factors (regulatory impact, estimation required)
- Match dengan existing MOCK_SCOPING structure

**GL.csv FSLI Mapping:**
```
Assets (1xxxxx):
- 1010100: Kas dan Setara Kas
- 1010200: Piutang Usaha
- 1011000: Persediaan

Liabilities (2xxxxx):
- 2100100: Hutang Usaha
- 2200100: Provisi Reklamasi

Equity (3xxxxx):
- 3100100: Modal Saham
- 3100200: Saldo Laba

Revenue (601xxxx):
- 6010000: Pendapatan

COGS (602xxxx):
- 6020000: HPP
- 6020500: Royalty
```

### 3. Materiality Values

**Decision**: Use rounded numbers untuk demo friendliness

**Rationale:**
- Easy to remember saat demo
- Still realistic dan traceable
- Avoid overly precise numbers (e.g., Rp 17.532.123.456)

**Example:**
```
If calculated Pre-Tax Income = Rp 347.5B
Round to Rp 350B for benchmark calculation
OM = Rp 350B × 5% = Rp 17.5B
PM = Rp 17.5B × 75% = Rp 13.125B
```

## Risks / Trade-offs

**[Risk]** Manual calculation bisa error

**→ Mitigation:**
- Double-check dengan Excel/calculator
- Document calculation steps dalam comment
- Cross-reference dengan GL.csv totals

**[Risk]** GL.csv structure berbeda dengan mock data structure

**→ Mitigation:**
- Map FSLI codes ke account categories
- Use GL.csv account names yang realistic
- Keep structure compatible dengan existing form

**[Trade-off]** Accuracy vs Simplicity

**→ Acceptable** karena:
- Demo purpose, bukan production
- Manual calculation sudah cukup accurate
- Can enhance dengan auto-script nanti

## Migration Plan

### Steps to Deploy

1. **Analyze GL.csv**
   - Extract Revenue accounts (601xxxx)
   - Extract COGS accounts (602xxxx)
   - Extract Operating Expenses (603xxxx)
   - Calculate Pre-Tax Income

2. **Calculate Materiality**
   - OM = Pre-Tax Income × 5%
   - PM = OM × 75%

3. **Update mock-data.ts**
   - Replace MOCK_MATERIALITY values
   - Update MOCK_SCOPING significant accounts

4. **Verify**
   - Build test
   - Check Scoping page displays correctly

### Rollback Strategy

Simple - revert mock-data.ts changes:
```bash
git checkout shared/mock-data.ts
```

No database atau backend changes, safe rollback.

## Open Questions

1. **Exact Pre-Tax Income dari GL.csv?**
   - Need to sum all P&L accounts
   - Will calculate during implementation

2. **Round numbers atau exact calculation?**
   - Lean toward: Round untuk demo friendliness
   - Exact calculation bisa terlalu precise (Rp 17.532.123.456)

3. **How many significant accounts?**
   - Current: 12 accounts
   - Keep similar count untuk consistency
