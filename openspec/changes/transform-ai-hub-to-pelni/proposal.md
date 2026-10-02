# Proposal: Update AI Hub Mock Data for PT PELNI Maritime Demo

## Why

The current AI Analytics Hub (`/ai-hub`) displays banking-specific data (AML, Loan/Credit NPL, CASA vs Loan growth, Suspense Account Aging) that was transformed in a previous change. To present a highly compelling and relevant ICOFR demo to **PT PELNI (Persero)**, the platform needs realistic maritime logistics and shipping operations mock data aligned with PELNI's core business processes (bunker fuel consumption, PSO subsidy & e-ticketing reconciliation, dry-docking repairs, port disbursements, and container cargo tracking).

## What Changes

- **Maritime Analytics Overhaul (Slide 8)**:
  - Replace Banking metrics with Maritime Shipping KPIs: Bunker (MDO/HFO) Consumption vs Nautical Miles Sailed, Bunker Discrepancy Rate (tolerance <= 2%), Unreconciled PSO & Port Clearance items, Fleet On-Time Performance (OTP) by Ship Cluster (Penumpang Utama, Tol Laut, Kapal Perintis).
  - Update Enterprise Risk Indicators: Off-manifest containers, dry-docking cost overruns, and bunkering density anomalies.
- **Maritime AI Use Cases (Slide 9)**:
  - Transform 6 AI Engines & Drilldown views:
    1. `bunker-anomaly`: Bunker & Fuel Anomaly Engine (SFOC vs ship speed & weather).
    2. `predictive-docking`: Predictive Dry-docking & Spare Part Procurement (RAB vs actual docking costs).
    3. `pso-ticket-recon`: Automated PSO Subsidy & Passenger Ticket Reconciliation (Kemenhub PSO vs e-manifest).
    4. `cargo-leakage`: Cargo Demurrage & Container Slot Leakage Detection (reefer & dry containers).
    5. `port-disbursement-nlp`: Port Disbursement & Agency Billing NLP (Pelindo official tariff vs agent invoices).
    6. `crew-payroll`: Vessel Crew Payroll & Per Diem Validation (logbook sailing days vs ABK claims).
- **Maritime Continuous Control Monitoring (CCM) (Slide 10)**:
  - Replace banking alerts (smurfing, dormant accounts) with maritime operational alerts: bunkering density mismatch at Tanjung Priok, off-manifest cargo on KM Sinabung, docking emergency PO exceeding authorization matrix on KM Bukit Siguntang, stevedoring tariff discrepancy at Belawan Branch.
- **Dedicated Data Source**:
  - Introduce `shared/ai-maritime-data.ts` to cleanly house all PT PELNI maritime mock datasets, chart series, and drilldown findings.
  - Wire `src/components/reports/AIAnalyticsMockup.tsx` to this new maritime data source.

## Capabilities

### Modified Capabilities
- `ai-hub-maritime-mockup`: Updates the AI Hub presentation data layer to serve maritime logistics and passenger shipping analytics tailored for PT PELNI.

## Impact

- `shared/ai-maritime-data.ts`: New file containing maritime drilldown datasets, metrics, and findings.
- `src/components/reports/AIAnalyticsMockup.tsx`: Updated presentation, chart labels, KPIs, and alerts.
- Localization files if applicable.
