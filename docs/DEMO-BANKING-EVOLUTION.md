# 🏦 AI Banking Evolution: Stakeholder Demo
**IndoGRC Pro - Digital Analytics Hub**  
*Project: Bank Artha Mandiri (BAM)*

---

## 📑 Agenda
1.  **The Sector Transition** (Mining → Banking)
2.  **Adaptive Branding & Intelligence**
3.  **Financial Analytics (Slide 8)**
4.  **AI Use Case Workbench (Slide 9)**
5.  **Continuous Control Monitoring (Slide 10)**
6.  **System Architecture**

<div style="page-break-after: always;"></div>

## Slide 1: The Transition
### *From Operational to Systemic Risk*

**Current State (Mining):**
*   Focus on physical asset integrity.
*   Risks: Weighbridge errors, contractor safety, fuel theft.

**Evolution (Banking):**
*   Focus on financial integrity and systemic stability.
*   Risks: Anti-Money Laundering (AML), Credit Portfolio defaults, Interest Rate manipulation.

**Visual Cue:**
*   Dashboard branding shifts from "Batubara Nusantara" to **"Bank Artha Mandiri"**.

<div style="page-break-after: always;"></div>

## Slide 2: Adaptive Intelligence
### *Dynamic Branding & Entity Awareness*

**Key Innovation:**
*   Platform automatically detects the **Industry Cluster** (Financial).
*   Terminology, Risk Libraries (Lampiran 2), and i18n keys adjust in real-time.

**Presentation Step:**
1.  Navigate to `/settings`.
2.  Update "Company Name" and "Logo URL".
3.  Observe instant update across the entire GRC suite.

<div style="page-break-after: always;"></div>

## Slide 3: Financial Analytics (Slide 8)
### *Liquidity & Portfolio Health Dashboard*

**Primary Visualizations:**
*   **CASA Growth vs Loan Disbursement**: Area chart showing "Cheap Funds" stability.
*   **NPL Ratio Status**: Gauge/Metric card showing Non-Performing Loan percentage.
*   **Transaction Variance**: Real-time detection of accounting discrepancies.

**Business Value:**
*   Shift from reactive reporting to **real-time liquidity monitoring**.

<div style="page-break-after: always;"></div>

## Slide 4: Advanced AI Use Cases (Slide 9)
### *Fraud & Risk Prediction Workbench*

**Case 1: AML Pattern Engine**
*   AI detects "Smurfing" and "Structuring" transaction patterns across millions of records.

**Case 2: NLP Credit Document Review**
*   Automated extraction of high-risk clauses from scanned Credit Agreements (PK).

**Case 3: Predictive Control Failure**
*   Early Warning for the "Credit Approval" cycle before audit findings occur.

<div style="page-break-after: always;"></div>

## Slide 5: Continuous Control Monitoring (Slide 10)
### *The Digital Audit Feed*

**Live Compliance Alerts:**
*   🚨 **HIGH**: Potential structuring detected ($9,990 repeated deposits).
*   ⚠️ **MED**: Unauthorized Interest Rate override in Core Banking.
*   ℹ️ **LOG**: Periodic Suspense Account aging check completed.

**Auditor Sign-off:**
*   Integrated workflow for Line 2 and Line 3 validation of AI alerts.

<div style="page-break-after: always;"></div>

## 🛠️ Architecture: AI Banking Flow

```text
┌────────────────┐      ┌──────────────────────────┐      ┌─────────────────────┐
│  CORE SYSTEMS  │      │    AI ANALYTICS HUB      │      │  ICOFR COMPLIANCE   │
├────────────────┤      ├──────────────────────────┤      ├─────────────────────┤
│                │      │                          │      │                     │
│ 🏦 Core Banking├─────▶│ 🔍 AML Pattern Engine    ├─────▶│ 🛡️ Internal Control │
│    (Transactions)     │    (Smurfing Detection)  │      │    Effectiveness    │
│                │      │                          │      │                     │
│ 📄 Credit Docs ├─────▶│ 📄 NLP Document Review   ├─────▶│ 📝 Audit Evidence   │
│    (PDF/Scanned)      │    (Clause Analysis)     │      │    & Sign-off       │
│                │      │                          │      │                     │
│ 📊 GL Data     ├─────▶│ 📈 Predictive Risk       ├─────▶│ 🚨 Continuous       │
│    (Balances)         │    (NPL & Liquidity)     │      │    Monitoring Feed  │
│                │      │                          │      │                     │
└────────────────┘      └────────────┬─────────────┘      └─────────────────────┘
                                     │
                        ┌────────────▼─────────────┐
                        │   ORGANIZATION SETTINGS  │
                        ├──────────────────────────┤
                        │  Entity: Artha Mandiri   │
                        │  Cluster: Financial      │
                        └──────────────────────────┘
```

<div style="page-break-after: always;"></div>

## 🧪 Implementation Traceability
**Change ID:** `transform-ai-hub-to-banking`

| Component | Implementation Reference |
| :--- | :--- |
| **Data Layer** | `shared/ai-banking-data.ts` |
| **Identity Logic** | `useOrganizationBranding.ts` |
| **Visuals** | Recharts (Area, Radar, Bar) |
| **Domain** | BUMN Financial Cluster (SK-5 Compliance) |

---
**PT IndoGRC Pro**  
*Internal Demo - Restricted Access*
