# IndoRCM Pro - ICOFR Lifecycle Platform

## Project Overview
IndoRCM Pro is a production-grade web application designed to digitize the ICOFR (Internal Control over Financial Reporting) lifecycle for State-Owned Enterprises (BUMN). It is fully aligned with **Regulation SK-5/DKU.MBU/11/2024**, providing a standardized, transparent, and auditable platform for the mandatory 5-step ICOFR process.

**Key Features:**
*   **BPM Visualization:** Visual business process mapping with standardized legends (Start, Manual, System, Decision, Document) as per **Lampiran 4**.
*   **Risk Library Cluster:** Industry-specific risk repository for 11 BUMN clusters (Energy, Finance, Logistics, etc.) as per **Lampiran 2**.
*   **Scoping & Materiality:** Automated OM/PM calculation with **Precision Group Multiplier (1.5x - 9x)** and a **Qualitative Haircut Wizard** based on **Table 4**.
*   **Significant Application Inventory:** Centralized repository for IT assets with ITGC status tracking and criticality mapping (**Bab III 1.5**).
*   **RCM Manager:** Repository for processes and controls with mandatory COSO 17 Principles, **ITDM (IPE/EUC)**, and **MRC** mapping.
*   **Precision EUC/IPE:** Granular classification for spreadsheet complexity (**Table 14**) and IPE report types (**Table 20**) with dynamic testing checklists.
*   **Design Validation:** Mandatory **Line 2 (ICOFR Officer)** validation workflow for all control designs.
*   **CSA Workspace:** Self-assessment tools for Line 1 (Process Owners) with **Fraud Risk** indicators.
*   **Testing Workbench:** TOD & TOE modules with **6 Granular Evaluation Attributes** (Table 21) and **Automated Sample Size Calculator** (Table 22).
*   **Deficiency Board:** Kanban remediation tracking with a **DoD Wizard** and **Aggregate Deficiency Analysis** (**Appendix 10**) for collective impact assessment.
*   **External Audit Portal:** Dedicated portal for **Independent Practitioners (KAP)** to review working papers and submit assurance opinions (**Bab VIII**).
*   **Dashboard & Analytics:** Real-time **17 COSO Principles Coverage Heatmap** and compliance KPIs.
*   **Regulatory Reporting:** Automated "Asesmen Manajemen" with **Digital Sign-off & Lock** (CEO/CFO).

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
    *   `rcm/`: RCM Manager, BPM Editor, Application Inventory, and SOC management.
    *   `audit/`: External Assurance Portal (KAP).
    *   `csa/`: Control Self-Assessment workspace.
    *   `testing/`: TOD & TOE testing workbench.
    *   `deficiencies/`: Kanban board and DoD Wizard.
    *   `reports/`: Regulatory reports with digital sign-off.
*   `src/components/rcm/`: `BPMEditor.tsx`, `RiskLibraryLookup.tsx`, `ControlEditor.tsx`.
*   `worker/`: Durable Object definitions and API routes.
*   `shared/`: Types and mock data.

## Development Conventions

*   **Regulatory Compliance:** Any UI or data model change MUST refer to Regulation SK-5/DKU.MBU/11/2024.
*   **Type Safety:** Shared types in `shared/types.ts` are the source of truth.
*   **Auditability:** Every entity mutation should be accompanied by an entry in the `auditTrail`.