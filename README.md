# IndoRCM Pro — ICOFR Lifecycle Platform

IndoRCM Pro is a production-grade web application that digitizes the ICOFR (Internal Control over Financial Reporting) lifecycle for BUMN (State-Owned Enterprises). It is explicitly designed to fulfill **Regulation SK-5/DKU.MBU/11/2024** by providing a standardized, transparent, and auditable platform covering the entire regulatory process.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dittorahmat/indorcm-icofr-lifecycle-platform)

## Overview

IndoRCM Pro centralizes the 5-step ICOFR lifecycle required for BUMN compliance:
1.  **Perancangan (Planning)**: Scoping significant accounts and building Risk Control Matrices (RCM).
2.  **Implementasi (Implementation)**: Self-assessments by process owners (CSA).
3.  **Evaluasi (Evaluation)**: Independent testing (TOD/TOE) by internal audit.
4.  **Remediasi (Remediation)**: Tracking and correcting control deficiencies.
5.  **Pelaporan (Reporting)**: Management assessment and audit result generation.

## Key Compliance Features

- **Standardized BPM**: Visual process mapping with regulatory legends (Start, Manual, System, etc.) as per **Lampiran 4**.
- **Industry Risk Library**: Built-in risk repository for 11 BUMN clusters (Energy, Finance, etc.) as per **Lampiran 2**.
- **Regulatory Scoping**: Automated OM/PM calculation with **Precision Group Multipliers** and a **Qualitative Haircut Wizard** (Table 4).
- **IT Asset Governance**: Centralized **Significant Application Inventory** with ITGC status tracking (Bab III 1.5).
- **Precision Control Testing**: Dynamic checklists for **EUC Complexity (Table 14)** and **IPE Query Validation (Table 20)**.
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
-   **Quality**: `bun lint` and `bun tsc --noEmit`.

## License
MIT License.
