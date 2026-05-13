# IndoGRC Pro - ICOFR Lifecycle Platform

## Project Overview
IndoGRC Pro is a production-grade web application designed to digitize the ICOFR (Internal Control over Financial Reporting) lifecycle for State-Owned Enterprises (BUMN). It is fully aligned with **Regulation SK-5/DKU.MBU/11/2024**, providing a standardized, transparent, and auditable platform for the mandatory 5-step ICOFR process.

**Key Features:**
*   **BPM Visualization:** Visual business process mapping with standardized legends as per **Lampiran 3** (Oval for Start/End, Hexagon for Risk, Inverted Triangle for Archive, Cylinder for System/Data Media).
*   **Risk Library Cluster:** Industry-specific risk repository for **11 BUMN clusters** (Energy, Food, Finance, Mining, etc.) as per **Lampiran 2**.
*   **Scoping & Materiality:** Automated OM/PM calculation with **Group Multipliers**, proportional allocation, and a dedicated **Equity Investee Monitoring** module (**FAQ No. 5**).
*   **Whistleblowing Recap:** Integration of fraud indicators from WBS into ICOFR risk assessment (**Lampiran 1 Principle 14 & 15**).
*   **Change Management Log:** Regulatory documentation of all modifications with a formal **Change Request & Approval Workflow** (Lini 1 to Lini 2) as per **Lampiran 6**.
*   **Regulatory Reporting:** Automated "Asesmen Manajemen" (Appendix 11) with **Digital Sign-off & Lock**, **QR Code Document Verification**, and automatic effectiveness conclusions.
*   **Governance & Integrity:** Built-in **Auditor Cooling-off Validation** (Bab II) and accountability **KPI Dashboards** for cycle tracking.

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
*   **ORM:** Drizzle ORM (PostgreSQL dialect)

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
*   **Design Quality & Accessibility:** Avoid "AI Slop" (generic layouts, tiny fonts). Minimum font size is 12px (text-xs). Use Shadcn/UI Design Tokens (--primary, --sidebar, etc.) instead of hardcoded hex colors.
*   **Actionable Dashboard:** The Dashboard must function as an "Action Center," prioritizing urgent tasks (remediation, pending validation) to drive the ICOFR lifecycle.
*   **Data Persistence:** Always generate and run drizzle migrations using `npx drizzle-kit push` after schema changes.
*   **Localization:** Support multi-language (English/Indonesian) using `src/i18n/**`. Ensure all UI strings are localized.
*   **Data Loss Prevention:** Implement `UnSavedChanges` warning for any form or editor state to prevent accidental data loss, following the `useUnsavedChanges` hook pattern.
*   **Navigation & Alerts:** Integrate critical workflows into the Sidebar menu and provide real-time feedback via a Notification Bell where appropriate.
*   **Code Quality:** Rigorously apply SOLID, DRY, KISS, and YAGNI principles. Actively identify and refactor code smells. After refactoring, verify system integrity (API endpoints, imports, etc.).
*   **Quality Assurance:** Adhere to TDD (Test Driven Development) with a "Fail Fast, Fix Early" mindset. Ensure all changes pass `type-check`, `test`, `lint`, and `build` commands. Create automated tests for new features and bug fixes.