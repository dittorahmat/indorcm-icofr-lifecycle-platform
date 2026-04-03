# 📊 Presentasi AI Use Cases - Slide 9 ICOFR

> **PT BATUBARA NUSANTARA SEJAHTERA**  
> Digital Analytics Hub - Advanced Predictive Analytics & Continuous Control Monitoring

---

## 🎯 Overview Slide 9

AI dapat digunakan untuk **8 use case** utama dalam ICOFR:

1. ✅ Fraud Detection
2. ✅ Anomaly Journal Entry
3. 🔮 **Predictive Control Failure**
4. 📄 **Contract Review (NLP)**
5. 🏢 **Vendor Risk Scoring**
6. 🔧 **Predictive Maintenance vs Capex**
7. 📈 Revenue Anomaly Detection
8. 🌱 ESG Reporting Anomaly

---

## 1️⃣ PREDICTIVE CONTROL FAILURE

### Status: **BETA**

### 🎯 Apa Ini?
Sistem yang **memprediksi kegagalan kontrol internal sebelum terjadi**. Early warning system untuk fungsi audit & compliance.

### 📊 Data Mockup

```
METRICS:
├─ Probability of Failure: 15% ⬇️
├─ Total Controls: 240 ⬆️
└─ Status: BETA

CHART: Line Chart - 30 Day Trend
┌─────────────────────────────┐
│ Day 1   → 12% ──┐           │
│ Day 10  → 18% ──┼─ Peak     │
│ Day 20  → 14% ──┼─ Improve  │
│ Day 30  → 15% ──┘─ Current  │
└─────────────────────────────┘

FINDINGS:
┌──────────────────────────────────────────────┐
│ LOG-01 │ Weighbridge Calibration │ HIGH │ 4 hari  │
│ FIN-01 │ Credit Approval         │ MED  │ 12 hari │
└──────────────────────────────────────────────┘
```

### 🔍 Cara Kerja

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Historical   │────▶│ ML Model     │────▶│ Prediction   │
│ Control Test │     │ Trending     │     │ "Control X   │
│ Results      │     │ Analysis     │     │ fails in 4d" │
└──────────────┘     └──────────────┘     └──────────────┘
```

### 💼 Use Case Nyata

**LOG-01: Weighbridge Calibration**
- **Masalah**: Kontrol kalibrasi jembatan timbang diprediksi gagal dalam 4 hari
- **Indikator**: Frekuensi error meningkat, deviasi pengukuran membesar
- **Action**: Jadwalkan maintenance SEBELUM failure terjadi

### 💡 Business Value

| Before | After |
|--------|-------|
| Reactive (fix after fail) | Proactive (prevent failure) |
| Downtime 2-3 hari | Downtime 0 hari |
| Audit finding | Clean audit opinion |

---

## 2️⃣ NLP CONTRACT REVIEW

### Status: **LIVE**

### 🎯 Apa Ini?
Menggunakan **Natural Language Processing** untuk review otomatis klausul kontrak PKP2B. Deteksi klausul berisiko atau yang hilang.

### 📊 Data Mockup

```
METRICS:
├─ Contracts Processed: 42 ⬆️
├─ High Risk Clauses: 5 ⬇️
└─ Status: LIVE

CHART: Bar Chart - Risk Clause Frequency
┌─────────────────────────────────────┐
│ Penalty        ████████    8        │
│ Escalation     ████████████ 12      │
│ Force Majeure  ████        4        │
│ Termination    ██████      6        │
└─────────────────────────────────────┘

FINDINGS:
┌──────────────────────────────────────────────────────┐
│ PKP2B-2024-001 │ PT TAMBANG JAYA │ HIGH             │
│                │ Missing: Environmental Liability    │
├──────────────────────────────────────────────────────┤
│ PO-SERV-882    │ CV LOGISTIK     │ MEDIUM           │
│                │ Missing: Fixed Price Lock           │
└──────────────────────────────────────────────────────┘
```

### 🔍 Cara Kerja

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Contract PDF │────▶│ NLP Model    │────▶│ Clause       │
│ /Doc         │     │ - Entity     │     │ Extraction   │
│              │     │ - Boundary   │     │ & Risk       │
│              │     │   Detection  │     │ Scoring      │
└──────────────┘     └──────────────┘     └──────────────┘
```

### 💼 Use Case Nyata

**PKP2B-2024-001: PT TAMBANG JAYA**
- **Masalah**: Tidak ada klausul Environmental Liability
- **Risk**: Tidak ada recourse hukum jika terjadi kerusakan lingkungan
- **Action**: Legal team perlu addendum kontrak

### 💡 Business Value

| Manual Review | AI Review |
|---------------|-----------|
| 2-3 hari per kontrak | 5 menit per kontrak |
| Human error prone | Consistent |
| 10 kontrak/minggu | 100+ kontrak/minggu |

---

## 3️⃣ VENDOR RISK SCORING

### Status: **BETA**

### 🎯 Apa Ini?
**Scoring multidimensional** vendor/kontraktor tambang berdasarkan: Safety, Compliance, Cost, Performance, Quality.

### 📊 Data Mockup

```
METRICS:
├─ Average Vendor Score: 78 ⬆️
─ Critical Risk Vendors: 3 ⬇️
└─ Status: BETA

CHART: Radar Chart - CV MAKMUR JAYA
              Safety
                45/100 ❌
             ╱        ╲
        Quality 90    Compliance 90
           ✅            ✅
             ╲        ╱
           Performance
              50/100 ⚠️

FINDINGS:
┌──────────────────────────────────────────────────────┐
│ CV MAKMUR JAYA                                       │
│ Safety: FAIL ❌ | Compliance: PASS ✅               │
│ → FINAL: HIGH RISK 🚨                               │
├──────────────────────────────────────────────────────┤
│ PT ALAT BERAT                                        │
│ Safety: PASS ✅ | Compliance: PASS ✅               │
│ → FINAL: LOW RISK ✅                                │
└──────────────────────────────────────────────────────┘
```

### 🔍 Cara Kerja

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Vendor Data  │────▶│ Scoring      │────▶│ Risk         │
│ - Safety     │     │ Algorithm    │     │ Category     │
│ - Compliance │     │ (Weighted)   │     │ Low/Med/High │
│ - Cost/Perf  │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

### 💼 Use Case Nyata

**CV MAKMUR JAYA: Safety Score 45/100**
- **Indikator**: Insiden keselamatan, near-miss reports, audit findings
- **Risk**: Bisa menyebabkan accident di site
- **Action**: Safety audit ulang atau suspend dari approved vendor list

### 💡 Business Value

| Traditional | AI-Powered |
|-------------|------------|
| Annual review | Real-time scoring |
| Subjective | Data-driven |
| Siloed data | Holistic view |

---

## 4️⃣ PREDICTIVE MAINTENANCE vs CAPEX

### Status: **POC** (Proof of Concept)

### 🎯 Apa Ini?
Analisis **kapan optimal maintenance vs beli alat baru**. Korelasi jam operasi, biaya maintenance, kondisi alat.

### 📊 Data Mockup

```
METRICS:
├─ Estimated Failures: 4 units ⬆️
├─ Fleet Health: 88% ⬇️
─ Status: POC

CHART: Scatter Plot - Maint Cost vs Hours
Cost ($)
  ↑
1200│         ● DT-101 (Money Pit)
    │
 800│      ● EX-202
    │
 250│   ●
  50│ ●  ●
    └────────────────────→ Hours
      1K  5K   12K   15K

FINDINGS:
┌──────────────────────────────────────────────────────┐
│ DT-101 (Komatsu HD785)                              │
│ Age: 8 years | Hours: 15,200 | CRITICAL 🚨         │
│ → REPLACE (maint > 60% harga baru)                  │
├──────────────────────────────────────────────────────┤
│ EX-202 (CAT 6040)                                   │
│ Age: 3 years | Hours: 6,400 | GOOD ✅              │
│ → CONTINUE regular maintenance                      │
└──────────────────────────────────────────────────────┘
```

### 🔍 Cara Kerja

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Telemetry    │────▶│ Cost Model   │────▶│ Decision:    │
│ - Hours      │     │ - Cumulative │     │ MAINTAIN     │
│ - Sensors    │     │   Maint Cost │     │ vs           │
│ - Error Log  │     │ - Resale Val │     │ REPLACE      │
└──────────────┘     └──────────────┘     └──────────────┘
```

### 💼 Use Case Nyata

**DT-101: Komatsu HD785 - 15,200 jam, 8 tahun**
- **Masalah**: Maintenance kumulatif $1,200 (40% dari harga baru $3,000)
- **Threshold**: >50-60% = lebih baik beli baru
- **Action**: Procurement mulai CAPEX request untuk replacement

### 💡 Business Value

| Reactive | Predictive |
|----------|------------|
| Breakdown → Stop production | Scheduled → Zero downtime |
| Emergency repair (2x cost) | Planned maintenance |
| Capex guesswork | Data-driven decision |

---

## 📋 Summary Comparison

```
┌─────────────────────┬────────────┬─────────────┬──────────┐
│ Use Case            │ Input      │ Output      │ Maturity │
├─────────────────────┼────────────┼─────────────┼──────────┤
│ Predictive Control  │ Test       │ Failure     │ BETA     │
│ Failure             │ Results    │ Prediction  │          │
├─────────────────────┼────────────┼─────────────┼──────────┤
│ NLP Contract Review │ PDF/Doc    │ Missing     │ LIVE     │
│                     │            │ Clauses     │          │
├─────────────────────┼────────────┼─────────────┼──────────┤
│ Vendor Risk Scoring │ Performance│ Multi-dim   │ BETA     │
│                     │ Data       │ Score       │          │
├─────────────────────┼────────────┼─────────────┼──────────┤
│ Predictive          │ Telemetry  │ Maintain vs │ POC      │
│ Maintenance         │ + Cost     │ Replace     │          │
└─────────────────────┴────────────┴─────────────┴──────────┘
```

---

## 🎯 Key Takeaways

### 1. **Shift dari Reactive → Proactive**
- Predictive Control: Deteksi sebelum gagal
- Predictive Maintenance: Replace sebelum breakdown

### 2. **Automation untuk Efficiency**
- NLP Contract: 100+ kontrak/minggu vs 10 manual
- Vendor Scoring: Real-time vs annual review

### 3. **Data-Driven Decision Making**
- Semua use case berbasis data historis + ML
- Bukan lagi "feeling" tapi "probability"

### 4. **Maturity Varies**
- LIVE: Sudah production-ready (NLP, Fraud, Anomaly)
- BETA: Testing terbatas (Predictive Control, Vendor)
- POC: Proof of Concept (Predictive Maintenance)

---

##  Next Steps

1. **Scale LIVE use cases** ke semua anak perusahaan
2. **Complete BETA testing** untuk Predictive Control & Vendor Scoring
3. **Validate POC** Predictive Maintenance dengan data real
4. **Integrate** semua use cases ke single dashboard

---

**Presentasi ini dibuat untuk:**  
PT IndoRCM ICOFR Lifecycle Platform  
© 2026 - Internal Use Only
