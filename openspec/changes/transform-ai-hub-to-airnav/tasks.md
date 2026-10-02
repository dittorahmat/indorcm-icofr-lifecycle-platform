## 1. Aviation Data Source

- [x] 1.1 Create `shared/ai-aviation-data.ts` with 6 AirNav drilldown engines (track-anomaly, cns-maintenance, route-charges-recon, movement-leakage, vendor-invoice-nlp, atc-roster) following `AIUseCaseDrilldown` type and verify type-check passes for the new file
- [x] 1.2 Add aviation chart series (traffic vs route charges, FIR handover OTP Jakarta/Makassar, NOTAM status) and CCM alert datasets and verify all records render without missing fields

## 2. AI Hub Rewire

- [x] 2.1 Rewire `AIAnalyticsMockup.tsx` import from `ai-maritime-data` to `ai-aviation-data` and verify all 6 drilldown views resolve
- [x] 2.2 Replace AnalyticsTab content (bunker vs NM, OTP kapal) with aviation KPIs and verify no maritime labels remain via grep `bunker|KM |PSO|cargo|voyage`
- [x] 2.3 Replace CCMTab alerts with aviation alerts (GNSS interference, NOTAM overdue, charges unreconciled > 30 hari, ILS calibration expired) and verify risk levels and thresholds display
- [x] 2.4 Update `AIHubPage.tsx` subtitle if maritime/generic and verify header reads AirNav aviation analytics

## 3. Localization and Quality Gates

- [x] 3.1 Add Indonesian and English locale keys for all new KPI, chart, findings, and CCM strings and verify no hardcoded text remains in modified files
- [x] 3.2 Run design-taste-frontend anti-slop checklist on modified UI (min 12px font, no italic data, no backdrop-blur, rounded-md/lg, semantic tokens) and verify compliance
- [x] 3.3 Run `npm run type-check`, `npm run lint`, `npm run build`, `npm test` sequentially (never in parallel) and verify all green; add/extend unit test for aviation data mapping to prevent regression

