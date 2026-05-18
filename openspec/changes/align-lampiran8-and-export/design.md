## Context

The `VerificationDesignPage.tsx` displays the Lampiran 8 (Ilustrasi Verifikasi Rancangan Pengendalian) matrix. Currently, it lacks several columns explicitly required by the SK-5/DKU.MBU/11/2024 regulation. To ensure compliance, we must add these columns and provide a way to export this matrix as a PDF for reporting.

## Goals / Non-Goals

**Goals:**
- Add `Aplikasi Pendukung`, `Fungsi Pelaksana`, `Pelaku Pengendalian`, `Item LK terdampak`, and `Periode Efektif` columns to the RCMTable in `VerificationDesignPage.tsx`.
- Implement a client-side PDF export/print feature using `window.print()` with optimized `@media print` CSS.
- Ensure the API backend (`/api/rcm-matrix/verification-design`) returns the necessary fields.

**Non-Goals:**
- Implementing a server-side PDF generation service (e.g., Puppeteer). Client-side printing is sufficient and simpler.
- Modifying other RCM matrices (ELC, TLC, ITGC) unless they directly share the same underlying column definition component that needs updating.

## Decisions

### 1. Client-Side Print vs. PDF Library
We will use the native browser `window.print()` functionality combined with targeted `@media print` CSS rules.
- *Rationale:* This is the most lightweight approach, avoids adding heavy frontend dependencies like `html2pdf.js` or `jspdf`, and handles large tables reasonably well by letting the browser manage pagination. We will hide UI elements (headers, sidebars, buttons) during print.

### 2. Adding Missing Columns
The missing columns will be added to the `columnGroups` definition in `VerificationDesignPage.tsx`. We will place them logically, likely near the `metadata` or `info` groups, reflecting the Lampiran 8 structure.
- *Rationale:* The data is already mapped in `rcmControls` (e.g., `applicationId`, `executingFunction`, `executorRole`, `affectedFsliItem`, `effectivePeriod`), so this is primarily a UI and API selection update.

## Risks / Trade-offs

- **Risk:** The table might be too wide to print cleanly on a standard A4 portrait page.
  - *Mitigation:* We will suggest Landscape orientation in print instructions or enforce it via CSS `@page { size: landscape; }`. We will also ensure columns can wrap text appropriately in print mode.
