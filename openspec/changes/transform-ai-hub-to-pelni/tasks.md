# Tasks: Transform AI Hub to PT PELNI Maritime Demo

- [x] 1. Create Maritime Mock Data Module <!-- id: 1 -->
  - [x] 1.1 Create `shared/ai-maritime-data.ts` with comprehensive mock drilldown records for the 6 use cases (`bunker-anomaly`, `predictive-docking`, `pso-ticket-recon`, `cargo-leakage`, `port-disbursement-nlp`, `crew-payroll`) <!-- id: 1.1 -->
  - [x] 1.2 Export typed datasets conforming to `AIUseCaseDrilldown` <!-- id: 1.2 -->

- [x] 2. Update AIAnalyticsMockup Component <!-- id: 2 -->
  - [x] 2.1 Update `AnalyticsTab`: Replace Banking Trend (loans/CASA) with Bunker Fuel Consumption vs Nautical Miles, replace NPL with Bunker Discrepancy Rate, replace Suspense Account with Unreconciled PSO & Port Clearance, update mini bar chart to Fleet OTP, and update Enterprise Risk Indicators to maritime operational risks <!-- id: 2.1 -->
  - [x] 2.2 Update `AICasesTab`: Replace the 6 use case cards with Maritime engines (`bunker-anomaly`, `predictive-docking`, `pso-ticket-recon`, `cargo-leakage`, `port-disbursement-nlp`, `crew-payroll`) and configure appropriate icons and color tags <!-- id: 2.2 -->
  - [x] 2.3 Update `AIDrilldownView`: Connect to `AI_MARITIME_DRILLDOWN_DATA`, update badge from "Financial Cluster" to "Maritime Logistics Cluster", and handle chart formatting cleanly <!-- id: 2.3 -->
  - [x] 2.4 Update `CCMTab`: Replace banking alerts with real-time maritime vessel, bunkering, and port operations alerts <!-- id: 2.4 -->

- [x] 3. Anti-AI Slop & UI Verification <!-- id: 3 -->
  - [x] 3.1 Check typography (>= 12px font), clean border radius (`rounded-md`/`rounded-lg`), no decorative italic, no blur glassmorphism, no distracting animations <!-- id: 3.1 -->
  - [x] 3.2 Verify responsive layout and dual-render compliance <!-- id: 3.2 -->

- [x] 4. Test & Quality Assurance <!-- id: 4 -->
  - [x] 4.1 Run type-check (`tsc`) <!-- id: 4.1 -->
  - [x] 4.2 Run test suite (`npm test`) and add/update tests if necessary <!-- id: 4.2 -->
  - [x] 4.3 Verify build (`npm run build`) <!-- id: 4.3 -->
