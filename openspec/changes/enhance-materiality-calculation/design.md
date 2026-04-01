## Context

**Current State:**
- ScopingPage memiliki form materiality calculation dengan input manual untuk Benchmark Value
- Overall Materiality (OM) hanya display-only (calculated field)
- GL data yang diupload di tab yang sama tidak terintegrasi dengan materiality calculation
- User workflow: Manual input benchmark → Calculate OM → Display PM

**Constraints:**
- GL data sudah diupload di Scoping tab (via GLDataIntake component)
- Benchmark categories: Pre-Tax Income, Revenue, Assets, Equity
- OM calculation: Benchmark Value × Percentage
- PM calculation: OM × (100% - Haircut%)

**Stakeholders:**
- Line 2 (ICOFR Manager): Set materiality thresholds
- External Auditor: Review materiality calculation
- Admin: Configure benchmark mapping

## Goals / Non-Goals

**Goals:**
- Auto-populate Benchmark Value dari uploaded GL data
- Provide GL account mapping untuk benchmark detection
- Enable manual override untuk Overall Materiality
- Real-time recalculation saat input berubah
- Maintain audit trail untuk manual adjustments

**Non-Goals:**
- Backend persistence untuk GL mapping (tetap di frontend state)
- Multi-GL comparison untuk benchmark selection
- Auto-sync dari ERP (manual upload tetap primary method)
- Complex benchmark formulas (simple mapping only)

## Decisions

### 1. GL Account Mapping Strategy

**Decision**: Rule-based mapping dengan FSLI code dan account patterns

**Mapping Rules:**
```typescript
const benchmarkMapping = {
  'Pre-Tax Income': {
    fsliCodes: ['6480000', '6490000', '6510000'], // Laba/Rugi Sebelum Pajak, Laba Bersih
    accountPatterns: ['Laba', 'Rugi', 'Pendapatan', 'Beban'],
    glSection: '6xxxxxx' // P&L accounts
  },
  'Revenue': {
    fsliCodes: ['6010000'], // Pendapatan
    accountPatterns: ['Pendapatan', 'Revenue', 'Penjualan'],
    glSection: '60xxxxx'
  },
  'Assets': {
    fsliCodes: ['1010100', '1010200', '1011000', '1020100'], // Kas, Piutang, Persediaan, Aset
    accountPatterns: ['Kas', 'Bank', 'Piutang', 'Persediaan', 'Aset'],
    glSection: '1xxxxxx' // Balance Sheet assets
  },
  'Equity': {
    fsliCodes: ['3010100', '3010200'], // Modal, Saldo Laba
    accountPatterns: ['Modal', 'Ekuitas', 'Saldo Laba'],
    glSection: '3xxxxxx'
  }
};
```

**Rationale:**
- FSLI code sudah ada di GL data (Kode_FSLI)
- Account patterns sebagai fallback jika FSLI tidak ada
- GL section (1x, 3x, 6x) untuk quick filtering

**Alternatives Considered:**
- User manual mapping UI → terlalu kompleks untuk MVP
- AI-based classification → overkill, rule-based sudah cukup akurat

### 2. Benchmark Value Calculation

**Decision**: Sum of matching GL account balances

**Calculation:**
```typescript
function calculateBenchmarkValue(glData: GLRow[], benchmark: string): number {
  const mapping = benchmarkMapping[benchmark];
  const matching = glData.filter(row => {
    // Priority 1: FSLI code match
    if (mapping.fsliCodes.includes(row.fsliCode)) return true;
    
    // Priority 2: Account name pattern
    if (mapping.accountPatterns.some(pattern => 
      row.accountName.toLowerCase().includes(pattern.toLowerCase())
    )) return true;
    
    return false;
  });
  
  return matching.reduce((sum, row) => sum + Math.abs(row.balance), 0);
}
```

**Rationale:**
- Simple sum (bukan net) untuk conservatism
- Absolute value untuk handle credit balances
- Multiple matching criteria untuk accuracy

### 3. OM Manual Override UI

**Decision**: Editable input field dengan indicator

**UI Design:**
```
┌─────────────────────────────────────────────┐
│ Overall Materiality (OM)                    │
│ ┌─────────────────────────────────────┐ ✏️  │
│ │ IDR 15,000,000,000                  │     │
│ └─────────────────────────────────────┘     │
│ Calculated: IDR 15,000,000,000              │
│ [Auto from Revenue] [Manual Override]       │
└─────────────────────────────────────────────┘
```

**Behavior:**
- Default: Calculated value (read-only with edit icon)
- Click edit icon → Convert to input field
- Manual adjustment → Show "Manual Override" badge
- Recalculate button → Reset to calculated value

**Rationale:**
- Clear indication auto vs manual
- Easy to revert to calculated
- Audit trail untuk compliance

### 4. Real-time Recalculation

**Decision**: React useEffect dengan dependency tracking

**Implementation:**
```typescript
useEffect(() => {
  if (autoPopulateEnabled && glData.length > 0) {
    const benchmarkValue = calculateBenchmarkValue(glData, formValues.benchmark);
    setValue('benchmarkValue', benchmarkValue);
  }
}, [formValues.benchmark, glData, autoPopulateEnabled]);

useEffect(() => {
  const calculatedOM = (formValues.benchmarkValue * formValues.percentage) / 100;
  setOverallMateriality(isOMManual ? manualOM : calculatedOM);
}, [formValues.benchmarkValue, formValues.percentage, isOMManual, manualOM]);
```

**Rationale:**
- Instant feedback untuk user
- No manual "Calculate" button needed
- Clear separation calculated vs manual

## Risks / Trade-offs

**[Risk]** GL mapping tidak akurat untuk semua format GL

**→ Mitigation:**
- Show matching preview sebelum auto-populate
- Allow user to adjust benchmark value manually
- Log mapping untuk debugging

**[Risk]** User confusion antara auto vs manual OM

**→ Mitigation:**
- Clear visual indicator (badge, icon)
- Tooltip explanation
- Reset button untuk kembali ke calculated

**[Risk]** Performance issue dengan large GL datasets (1000+ rows)

**→ Mitigation:**
- Debounced calculation (200ms delay)
- Web Worker untuk complex mapping
- Show loading indicator

**[Trade-off]** Auto-populate accuracy vs simplicity

**→ Acceptable** karena:
- Rule-based mapping cukup akurat untuk大多数 cases
- User dapat manual adjust jika needed
- Better daripada manual input dari scratch

**[Risk]** Audit trail requirement untuk manual OM override

**→ Mitigation:**
- Track isOMManual flag
- Log timestamp dan value saat manual override
- Future: backend persistence untuk audit trail

## Migration Plan

### Steps to Deploy

1. **Add GL mapping utilities** di compliance-utils.ts
   - benchmarkMapping constant
   - calculateBenchmarkValue() function
   - detectBenchmarkFromGL() function

2. **Update ScopingPage form**
   - Add auto-populate toggle
   - Add OM manual override input
   - Add real-time recalculation

3. **Integration dengan GLDataIntake**
   - Pass GL data ke materiality calculation
   - Auto-detect saat GL upload complete

4. **UI enhancements**
   - Edit icon untuk OM field
   - Manual override badge
   - Reset to calculated button

5. **Testing**
   - Test dengan Sample Data GL.csv
   - Test manual override flow
   - Test recalculation scenarios

### Rollback Strategy

- Revert ScopingPage.tsx ke versi sebelumnya
- Remove GL mapping utilities
- No database changes, safe rollback

## Open Questions

1. **Should we persist manual OM override to backend?**
   - Currently frontend state only
   - Future: API endpoint untuk save materiality settings

2. **What if multiple GL accounts match the same benchmark?**
   - Current: Sum all matching
   - Alternative: Show breakdown, let user choose

3. **Should benchmark mapping be configurable?**
   - Current: Hardcoded rules
   - Future: Admin UI untuk customize mapping

4. **Audit trail requirements?**
   - Current: Frontend state only
   - Future: Log to backend for compliance
