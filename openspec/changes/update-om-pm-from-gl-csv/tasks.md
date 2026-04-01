## 1. GL.csv Analysis

- [x] 1.1 Extract Revenue accounts (601xxxx) dari GL.csv
- [x] 1.2 Extract COGS accounts (602xxxx) dari GL.csv
- [x] 1.3 Extract Operating Expenses (603xxxx) dari GL.csv
- [x] 1.4 Calculate Pre-Tax Income (Revenue - COGS - OpEx)

## 2. Materiality Calculation

- [x] 2.1 Calculate OM = Pre-Tax Income × 5%
- [x] 2.2 Calculate PM = OM × 75% (25% haircut)
- [x] 2.3 Round values untuk demo friendliness

## 3. Update Mock Data

- [x] 3.1 Update MOCK_MATERIALITY dengan calculated OM/PM
- [x] 3.2 Update MOCK_SCOPING significant accounts untuk match GL.csv
- [x] 3.3 Add comments dengan calculation breakdown

## 4. Verification

- [x] 4.1 Build test
- [x] 4.2 Verify Scoping page displays correctly
- [x] 4.3 Verify materiality calculation logic
