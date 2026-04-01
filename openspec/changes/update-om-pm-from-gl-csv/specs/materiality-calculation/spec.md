## MODIFIED Requirements

### Requirement: Materiality Calculation from GL Data

Sistem SHALL calculate Overall Materiality (OM) dan Performance Materiality (PM) berdasarkan data dari Sample Data GL.csv.

**Calculation Method:**
1. Extract Pre-Tax Income dari GL accounts:
   - Revenue (601xxxx): Credit balance
   - COGS (602xxxx): Debit balance
   - Operating Expenses (603xxxx): Debit balance
   - Pre-Tax Income = Revenue - COGS - Operating Expenses

2. Apply benchmark:
   - OM = Pre-Tax Income × 5%

3. Apply haircut:
   - PM = OM × (100% - Haircut%)
   - Default haircut: 25%

#### Scenario: Materiality calculated from GL.csv
- **WHEN** mock data di-load
- **THEN** OM dan PM calculated berdasarkan GL.csv Pre-Tax Income

#### Scenario: Benchmark percentage
- **WHEN** Pre-Tax Income = X
- **THEN** OM = X × 5%

#### Scenario: Haircut application
- **WHEN** OM = Y dan Haircut = 25%
- **THEN** PM = Y × 75%
