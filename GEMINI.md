# IndoRCM Pro - ICOFR Lifecycle Platform

## Project Overview
IndoRCM Pro is a production-grade web application designed to digitize the ICOFR (Internal Control over Financial Reporting) lifecycle for State-Owned Enterprises (BUMN). It is fully aligned with **Regulation SK-5/DKU.MBU/11/2024**, providing a standardized, transparent, and auditable platform for the mandatory 5-step ICOFR process.

**Key Features:**
*   **BPM Visualization:** Visual business process mapping with standardized legends as per **Lampiran 3** (Oval for Start/End, Hexagon for Risk, Cylinder for Archive).
*   **Risk Library Cluster:** Industry-specific risk repository for 11 BUMN clusters as per **Lampiran 2**.
*   **Scoping & Materiality:** Automated OM/PM calculation with **Precision Group Multiplier (1.5x - 9x)** and proportional **Group Materiality Allocation** based on asset share (**FAQ No. 4**).
*   **Haircut Wizard:** Risk-based PM determination based on **Table 4**.
*   **Whistleblowing Recap:** Integration of fraud indicators from WBS into ICOFR risk assessment (**Lampiran 1 Principle 14 & 15**).
*   **Change Management Log:** Regulatory documentation of all business process and control modifications as per **Lampiran 6**.
*   **Significant Application Inventory:** Centralized repository for IT assets with ITGC status tracking and criticality mapping (**Bab III 1.5**).
*   **SOC Monitoring:** Formal evaluation and reviu of Third-Party Service Organization reports (**Bab III 4.3**).
*   **Precision Risk Assessment:** Objective **Qualitative Risk Wizard** based on 9 regulatory criteria (Tabel 11) and **COBIT to ITGC validation** (Tabel 1).
*   **Precision EUC/IPE:** Granular classification for spreadsheet complexity (**Table 14**) and IPE report types (**Table 20**) with dynamic testing checklists.
*   **CSA Validation Workflow:** Two-tier self-assessment with **Line 2 (ICOFR Officer)** formal validation of Line 1 results (**Bab IV 2.3**).
*   **Testing Workbench:** TOD & TOE modules with **6 Mandatory Evaluation Attributes** (Table 21) and **Automated Sample Size Calculator** (Table 22).
*   **Deficiency Board:** Kanban remediation tracking with **Compensating Control** mapping and **Aggregate Deficiency Analysis** (**Appendix 10**).
*   **External Audit Portal:** Dedicated portal for **Independent Practitioners (KAP)** to review working papers and submit assurance opinions (**Bab VIII**).
*   **Regulatory Reporting:** Automated "Asesmen Manajemen" with **Digital Sign-off & Lock** (CEO/CFO) and **Client-side Excel/CSV Export**.

## Technology Stack

### Frontend
*   **Framework:** React 18+ (Vite)
*   **Language:** TypeScript
*   **State Management:** TanStack Query, Zustand
*   **Diagramming:** React Flow (BPM Visualization)
*   **Styling:** Tailwind CSS, Shadcn/UI, Framer Motion
*   **Forms:** React Hook Form + Zod

### Backend
*   **Runtime:** Cloudflare Workers
*   **Framework:** Hono (Lightweight API routing)
*   **Persistence:** Cloudflare Durable Objects (IndexedEntity pattern)

## Directory Structure

*   `src/pages/`:
    *   `scoping/`: Materiality, Scoping Matrix, and Haircut Wizard.
    *   `rcm/`: RCM Manager, BPM Editor, Change Log, SOC Monitoring, and App Inventory.
    *   `audit/`: External Assurance Portal (KAP).
    *   `csa/`: Control Self-Assessment workspace with Line 2 validation.
    *   `testing/`: TOD & TOE testing workbench with 6 pilar evaluation.
    *   `deficiencies/`: Kanban board, DoD Wizard, and Aggregate Analysis.
    *   `reports/`: Regulatory reports, WBS recap, and digital sign-off.
*   `shared/`: `types.ts` (Source of Truth), compliance utilities.

## Development Conventions

*   **Regulatory Compliance:** Any UI or data model change MUST refer to Regulation SK-5/DKU.MBU/11/2024.
*   **Type Safety:** Shared types in `shared/types.ts` are the source of truth.
*   **Auditability:** Every entity mutation should be accompanied by an entry in the `auditTrail` and `ChangeLog`.