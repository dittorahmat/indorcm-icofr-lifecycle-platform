## 1. GL Benchmark Mapping Implementation

- [ ] 1.1 Create benchmarkMapping constant di compliance-utils.ts
- [ ] 1.2 Implement calculateBenchmarkValue() function
- [ ] 1.3 Add FSLI code mapping (Pre-Tax Income, Revenue, Assets, Equity)
- [ ] 1.4 Add account name pattern matching fallback
- [ ] 1.5 Write unit tests untuk benchmark calculation

## 2. ScopingPage Integration

- [ ] 2.1 Add auto-populate toggle untuk Benchmark Value
- [ ] 2.2 Integrate GL data dengan materiality calculation
- [ ] 2.3 Add real-time recalculation useEffect hooks
- [ ] 2.4 Add OM manual override input field
- [ ] 2.5 Add edit icon untuk OM field (toggle read/write mode)
- [ ] 2.6 Add "Manual Override" badge indicator
- [ ] 2.7 Add "Reset to Calculated" button

## 3. UI Enhancements

- [ ] 3.1 Add benchmark breakdown display (show values per category)
- [ ] 3.2 Add confidence indicator untuk data quality
- [ ] 3.3 Add tooltip explanations untuk auto vs manual
- [ ] 3.4 Add loading indicator saat calculating benchmark
- [ ] 3.5 Add warning jika GL data tidak lengkap

## 4. Audit Trail

- [ ] 4.1 Track isOMManual flag di state
- [ ] 4.2 Log manual override timestamp dan values
- [ ] 4.3 Add audit trail display (optional, future enhancement)

## 5. Testing

- [ ] 5.1 Test dengan Sample Data GL.csv
- [ ] 5.2 Test auto-populate Pre-Tax Income
- [ ] 5.3 Test auto-populate Revenue
- [ ] 5.4 Test OM manual override flow
- [ ] 5.5 Test reset to calculated
- [ ] 5.6 Test real-time recalculation

## 6. Documentation

- [ ] 6.1 Update README dengan benchmark mapping rules
- [ ] 6.2 Add user guide untuk materiality calculation
- [ ] 6.3 Document GL account mapping customization
