## Why

Halaman `/ai-hub` saat ini menampilkan data mock PELNI maritim (konsumsi bunker, dry-docking, PSO ticketing, cargo) yang tidak relevan bagi audiens AirNav Indonesia (Perum LPPNPI). Untuk demo ICOFR yang meyakinkan ke penyedia layanan navigasi penerbangan tunggal Indonesia, platform membutuhkan mock data aviasi: pergerakan lalu lintas vs penagihan route charges, anomali flight plan vs radar track, rekonsiliasi NOTAM/AIS, dan monitoring CNS.

## What Changes

- **Aviation Analytics Overhaul (Slide 8)**:
  - Ganti metrik maritim dengan KPI aviasi: Traffic Movements vs Route Charges Billed, Billing Reconciliation Rate (toleransi <= 1%), NOTAM aktif & overdue, FIR Handover OTP (Jakarta vs Makassar).
  - Update Enterprise Risk Indicators: unidentified track, GNSS interference report, ILS calibration expired.
- **Aviation AI Use Cases (Slide 9)**:
  - Transform 6 AI Engines & Drilldown views:
    1. `track-anomaly`: Flight Plan vs Radar Track Anomaly Engine (deviasi rute & unidentified track).
    2. `cns-maintenance`: Predictive CNS Maintenance & Spare Part Procurement (RAB vs actual ILS/radar/ADS-B costs).
    3. `route-charges-recon`: Automated Route Charges Billing Reconciliation (flight plan vs invoice vs payment maskapai).
    4. `movement-leakage`: Movement & Slot Leakage Detection (movement tercatat vs tertagih).
    5. `vendor-invoice-nlp`: Vendor Invoice & CNS Contract NLP (kontrak vs invoice vendor).
    6. `atc-roster`: ATC Roster, License & Allowance Validation (jam dinas & lisensi vs tunjangan).
- **Aviation Continuous Control Monitoring (CCM) (Slide 10)**:
  - Ganti alert maritim dengan alert operasional aviasi: GNSS interference sector, NOTAM overdue, route charges unreconciled > 30 hari, ILS calibration expired.
- **Dedicated Data Source**:
  - Introduce `shared/ai-aviation-data.ts` untuk menampung seluruh dataset mock aviasi AirNav, chart series, dan drilldown findings.
  - Wire `src/components/reports/AIAnalyticsMockup.tsx` ke sumber data aviasi baru ini.

## Capabilities

### New Capabilities
- `ai-hub-airnav-mockup`: Presentation data layer AI Hub untuk analitik navigasi penerbangan AirNav Indonesia (Slide 8/9/10, 6 AI engines, CCM alerts).

### Modified Capabilities

## Impact

- `shared/ai-aviation-data.ts`: File baru berisi aviation drilldown datasets, metrics, dan findings.
- `src/components/reports/AIAnalyticsMockup.tsx`: Update presentasi, chart labels, KPIs, dan alerts ke aviasi.
- `src/pages/reports/AIHubPage.tsx`: Update subtitle bila masih bernada maritim/generik.
- Localization files bila berlaku (`src/i18n/locales/**`).
