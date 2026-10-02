## Purpose

Menyajikan lapisan data presentasi AI Hub yang relevan dengan operasi navigasi penerbangan AirNav Indonesia (Perum LPPNPI) untuk demo ICOFR yang meyakinkan.

## ADDED Requirements

### Requirement: Aviation analytics tab menampilkan KPI navigasi penerbangan
Sistem SHALL menampilkan tab Data Analytics (Slide 8) dengan metrik aviasi AirNav: Traffic Movements vs Route Charges Billed, Billing Reconciliation Rate, NOTAM aktif dan overdue, serta FIR Handover OTP per wilayah (Jakarta vs Makassar).

#### Scenario: Auditor membuka tab analytics
- **WHEN** pengguna membuka `/ai-hub` dan memilih tab Data Analytics
- **THEN** sistem menampilkan chart pergerakan vs penagihan, OTP handover FIR, dan indikator risiko (unidentified track, GNSS interference, ILS calibration expired) tanpa sisa label maritim (bunker, kapal, PSO).

### Requirement: Enam AI use cases aviasi dengan drilldown
Sistem SHALL menyediakan enam AI engines aviasi, masing-masing dengan metrics, chart, dan findings yang dapat di-drilldown: track-anomaly, cns-maintenance, route-charges-recon, movement-leakage, vendor-invoice-nlp, atc-roster.

#### Scenario: Pengguna melakukan drilldown salah satu engine
- **WHEN** pengguna memilih salah satu dari enam AI engines aviasi
- **THEN** sistem menampilkan metrics ringkas, visualisasi chart sesuai tipe data, dan daftar findings dengan tingkat risiko (Critical/High/Medium/Low) dan status tindak lanjut.

### Requirement: CCM monitoring menampilkan alert operasional aviasi
Sistem SHALL menampilkan tab CCM Monitoring (Slide 10) dengan alert operasional aviasi: GNSS interference per sektor, NOTAM overdue, route charges unreconciled lebih dari 30 hari, dan ILS calibration expired — menggantikan alert maritim.

#### Scenario: Lini 2 meninjau alert CCM
- **WHEN** pengguna membuka tab CCM Monitoring
- **THEN** sistem menampilkan daftar alert aviasi dengan lokasi (FIR/sektor/bandara), nilai deviasi, dan ambang batas yang jelas untuk tindak lanjut kontrol.

### Requirement: Seluruh string UI terlokalisasi Indonesia dan Inggris
Sistem SHALL menyediakan label, deskripsi chart, dan status findings dalam Bahasa Indonesia dan Inggris melalui file locale, tanpa teks hardcoded.

#### Scenario: Pengguna berganti bahasa
- **WHEN** pengguna mengganti bahasa aplikasi antara Indonesia dan Inggris pada halaman AI Hub
- **THEN** seluruh label KPI, chart, findings, dan alert CCM tampil dalam bahasa yang dipilih tanpa sisa string hardcoded.
