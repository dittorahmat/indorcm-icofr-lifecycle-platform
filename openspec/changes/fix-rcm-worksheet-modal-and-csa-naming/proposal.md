## Why

When users click "Open RCM Worksheet" on a sub-process row in BPMPage, the system inadvertently routes to the CSA tab and frequently opens the detailed assessment form rather than the RCM worksheet or the CSA history list. This occurs due to hardcoded default tab state in `BPMModal` and residual un-cleared `selectedSamples` state forcing `useCSA` into form mode. Furthermore, CSA records currently rely on an unstructured free-text `period` field without a standardized, auditable working paper reference code (e.g., `CSA-{BPM_CODE}-{YEAR}-{PERIOD}`) or fallback hierarchy, which impairs traceability under Regulation SK-5/DKU.MBU/11/2024.

## What Changes

- **BPMModal Tab & State Reset**:
  - Add `initialTab` prop to `BPMModal` defaulting to `"worksheet"` when opened from RCM Worksheet action.
  - Reset `activeTab` to `initialTab` when modal opens.
  - Clear `selectedSamples` state when `BPMModal` closes (`isOpen -> false`) to prevent residual sample data from forcing CSA into form view.
  - Ensure `useCSA` initializes in `"list"` view unless an explicit action (e.g. creating new assessment or viewing detail) is requested.
- **Structured Period Selector**:
  - Replace free-text `period` input with a structured quarter/period selector (`Q1`, `Q2`, `Q3`, `Q4 / Annual`).
  - Automatically bind the assessment year to the current active working/fiscal year.
- **System-Generated CSA Reference Code**:
  - Introduce an automated, unique reference code formula: `CSA-{BPM_CODE}-{YEAR}-{PERIOD}`.
  - Implement a fallback hierarchy when `bpmCode` is missing:
    1. Primary: Process `bpmCode` (e.g., `FIN01` -> `CSA-FIN01-2025-Q1`).
    2. Secondary fallback: Account `noGL` (e.g., `GL110100` -> `CSA-GL110100-2025-Q1`).
    3. Tertiary fallback: Process ID slice (e.g., `PROC-A8F2` -> `CSA-PROC-A8F2-2025-Q1`).
  - Display the generated reference code as a prominent badge in `CSAList` and `CSAForm`.

## Capabilities

### Modified Capabilities
- `bpm-execution-hub`: Update BPMModal requirements to support configurable initial tab and state isolation on modal open/close.
- `csa-management`: Update CSA requirements to enforce system-generated reference codes and structured period selection aligned with fiscal cycles.

## Impact

- **Frontend**:
  - `src/components/bpm/BPMModal.tsx`: Add `initialTab` prop, reset tab on open, reset `selectedSamples` on close.
  - `src/pages/bpm/BPMPage.tsx`: Pass `initialTab="worksheet"` when opening modal from `onOpenWorksheet`.
  - `src/hooks/use-csa.ts`: Guard view initialization against stale samples.
  - `src/components/bpm/CSATabContent.tsx`: Support structured period and reference display.
  - `src/components/bpm/CSAForm.tsx`: Replace free-text period input with structured period dropdown and read-only Reference Code badge.
  - `src/components/bpm/CSAList.tsx`: Display system-generated Reference Code alongside period and status badges.
- **Shared / Lib**:
  - Helper utility to format and compute CSA reference code with fallback hierarchy.
