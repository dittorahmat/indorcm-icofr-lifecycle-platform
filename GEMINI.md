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

## Mandat Penyelesaian Tahap (CRITICAL)

Setiap kali menyelesaikan sebuah fitur, perbaikan bug, atau fase pengembangan, Anda **WAJIB** menjalankan urutan validasi berikut tanpa perlu diminta kembali oleh pengguna:

1.  **Sinkronisasi Skema Database:** Jika ada perubahan pada `worker/db/schema.ts`, jalankan `npx drizzle-kit push` untuk menerapkan perubahan ke database PostgreSQL secara langsung.
2.  **Lokalisasi Penuh (i18n):** Periksa seluruh file yang dimodifikasi. Pastikan **TIDAK ADA** teks hardcoded (Inggris maupun Indonesia). Gunakan `useTranslation` dan file di `src/i18n/locales/**`.
3.  **Integritas Tipe:** Jalankan `npm run type-check`. Perbaiki semua error TS sebelum melangkah maju.
4.  **Standar Kode (Lint):** Jalankan `npm run lint`. Pastikan tidak ada peringatan atau error yang tersisa.
5.  **Verifikasi Kompilasi (Build):** Jalankan `npm run build`. Perubahan dianggap gagal jika proses build tidak berhasil.
6.  **Pengujian Otomatis (Test):** Jalankan `npm test`. Tambahkan unit test baru jika Anda menambahkan fitur baru atau melakukan perubahan di suatu fitur untuk mencegah regresi.

## Development Conventions

*   **Regulatory Compliance:** Any UI or data model change MUST refer to Regulation SK-5/DKU.MBU/11/2024.
*   **Type Safety:** Shared types in `shared/types.ts` are the source of truth.
*   **Auditability:** Every entity mutation should be accompanied by an entry in the `auditTrail` and `ChangeLog`.
*   **Design Quality & Accessibility:** Avoid "AI Slop" (generic layouts, tiny fonts). Minimum font size is 12px (text-xs). Use Shadcn/UI Design Tokens (--primary, --sidebar, etc.) instead of hardcoded hex colors.
*   **Actionable Dashboard:** The Dashboard must function as an "Action Center," prioritizing urgent tasks (remediation, pending validation) to drive the ICOFR lifecycle.
*   **Data Persistence:** Always generate and run drizzle migrations using `npx drizzle-kit push` after schema changes.
*   **Localization:** Support multi-language (English/Indonesian) using `src/i18n/**`. All UI strings **MUST** be localized.
*   **Data Loss Prevention:** Implement `UnSavedChanges` warning for any form or editor state to prevent accidental data loss, following the `useUnsavedChanges` hook pattern.
*   **Navigation & Alerts:** Integrate critical workflows into the Sidebar menu and provide real-time feedback via a Notification Bell where appropriate.
*   **File Size & Modularization Threshold (Max LOC Rule):**
    *   **Soft Limit (500 LOC):** Component UI / Container files should not exceed 500 lines. If a file exceeds 500 LOC, actively consider refactoring into smaller modular components (extract dialogs/modals, toolbars, palettes, or custom hooks).
    *   **Hard Limit (800 LOC):** Files exceeding 800 LOC are strictly frozen from receiving new functional additions until decomposed into sub-components or domain services first.
    *   **Single Responsibility:** Separate orchestrator containers from isolated presentation widgets, modals, and business/state calculation logic.
*   **Quality Assurance:** Adhere to TDD (Test Driven Development) with a "Fail Fast, Fix Early" mindset. A task is only "Done" when it passes all steps in the **Mandat Penyelesaian Tahap**.