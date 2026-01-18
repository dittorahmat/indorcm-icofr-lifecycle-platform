# IndoRCM Pro — ICOFR Lifecycle Platform

IndoRCM Pro is a production-grade web application that digitizes the ICOFR (Internal Control over Financial Reporting) lifecycle for BUMN (State-Owned Enterprises). It is explicitly designed to fulfill **Regulation SK-5/DKU.MBU/11/2024** by providing a standardized, transparent, and auditable platform covering the entire regulatory process.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dittorahmat/indorcm-icofr-lifecycle-platform)

## Overview

IndoRCM Pro centralizes the 5-step ICOFR lifecycle required for BUMN compliance:
1.  **Perancangan (Planning)**: Scoping significant accounts, building Risk Control Matrices (RCM), and mapping BPM.
2.  **Implementasi (Implementation)**: Self-assessments by process owners (CSA) with Line 2 validation.
3.  **Evaluasi (Evaluation)**: Independent testing (TOD/TOE) by internal audit with 6 mandatory attributes.
4.  **Remediasi (Remediation)**: Tracking deficiencies with aggregate impact analysis and compensating controls.
5.  **Pelaporan (Reporting)**: Fraud indicators (WBS) integration, management assessment, and CEO/CFO sign-off.

## Key Compliance Features

- **Standardized BPM**: Visual process mapping with regulatory legends (Oval Start/End, Hexagon Risk, Cylinder Archive) as per **Lampiran 3**.
- **Whistleblowing Integration**: Recap of fraud indicators to drive risk-based scoping (**Prinsip 14 & 15**).
- **Group Consolidation**: Automated OM/PM calculation with **Precision Group Multipliers** (Table 25) and **Subsidiary Materiality Allocation** (FAQ No. 4).
- **Change Management Log**: Immutable audit trail of process and control changes as per **Lampiran 6**.
- **SOC Monitoring**: Formal reviu of 3rd party SOC reports with compliance checklist (**Bab III 4.3**).
- **IT Asset Governance**: Centralized **Significant Application Inventory** with ITGC status tracking (Bab III 1.5).
- **Precision Risk Assessment**: Objective **Qualitative Risk Wizard** based on 9 criteria (Table 11) and **COBIT-to-ITGC Area Validation** (Table 1).
- **Independent Assurance**: Dedicated **External Audit Portal** for KAP review and digital attestation (Bab VIII).
- **Granular Audit Evidence**: TOD/TOE workbench with **6 Mandatory Evaluation Attributes** (Table 21).
- **Aggregate Analysis**: deficiency board with **Aggregate Assessment (Appendix 10)** to evaluate collective impact of related findings.
- **Digital Sign-off**: CEO & CFO **Sign & Lock** workflow for Asesmen Manajemen (Appendix 11).

## Technology Stack

### Frontend
- **Framework**: React 18+ (Vite), React Router 6.
- **State**: TanStack Query (Server), Zustand (Local).
- **UI/Diagrams**: ShadCN/UI + Tailwind CSS + **React Flow**.
- **Forms**: React Hook Form + Zod.

### Backend
- **Server**: Hono (Edge-ready API).
- **Persistence**: Cloudflare Durable Objects (IndexedEntity pattern).
- **Edge-Optimized**: Native Cloudflare Workers deployment.

## Installation

1.  **Prerequisites**: Node.js 18+ or Bun.
2.  **Clone and Install**:
    ```bash
    git clone <repo-url>
    bun install
    ```
3.  **Setup**:
    - Run `bun cf-typegen` to generate Worker types.

## Development

-   **Start Dev Server**: `bun dev` (Frontend: `http://localhost:3000`).
-   **Quality**: `bun lint` and `bun x tsc --noEmit`.

## License
MIT License.
