## Context

See proposal.md for motivation. Currently, `BPMModal.tsx` maintains internal state `activeTab = "csa"` and `selectedSamples = []`. When the modal closes, `selectedSamples` is not cleared. When reopened, `CSATabContent` and `useCSA` detect `initialSamples.length > 0` and trigger `initializeFromSamples()`, forcing the view into `"form"` (detail/assessment mode) instead of showing the RCM worksheet or CSA history list. Furthermore, `csaRecords.period` in the schema and form is an uncontrolled free-text string (defaulting to `"2025-Q1"`), and CSA records lack a standardized unique reference code.

## Goals / Non-Goals

**Goals:**
- **Reliable Modal Navigation**: Clicking "Open RCM Worksheet" in BPMPage always opens the `"worksheet"` tab.
- **Transient State Isolation**: Closing `BPMModal` cleans up residual `selectedSamples` and resets tab states so subsequent openings start in a clean state.
- **System-Generated Reference Code**: A deterministic helper function produces standardized working paper references (`CSA-{BPM_CODE}-{YEAR}-{PERIOD}`) with a robust fallback hierarchy.
- **Structured Period Selector**: Controlled dropdown for period (`Q1`, `Q2`, `Q3`, `Q4 / Annual`) tied to the active working fiscal year.
- **Zero Schema Disruption**: The composite period value stored in the database remains backwards-compatible with existing queries and PDF export templates.

**Non-Goals:**
- Altering the PostgreSQL database schema for `csa_records` (deterministic computation avoids breaking migrations).
- Modifying sampling algorithms or TOD/TOE review workflows.

## Decisions

### Decision 1: Configurable `initialTab` in `BPMModal`
- **Rationale**: `BPMModal` is used in multiple contexts (e.g., `BPMPage` for RCM Worksheet vs `TodoListPage` for CSA execution hub). Adding an optional `initialTab` prop (defaulting to `"worksheet"`) allows callers to express intent explicitly.
- **Alternatives Considered**: Hardcoding tab resets inside `BPMPage` or child components. This was rejected because it violates component encapsulation.

### Decision 2: State Cleanup on Modal Dismissal
- **Rationale**: When `isOpen` transitions to `false`, `BPMModal` must reset `selectedSamples` to `[]`. Additionally, `activeTab` resets to `initialTab`. In `use-csa.ts`, the view defaults strictly to `"list"` unless explicit action is triggered.
- **Alternatives Considered**: Keeping samples indefinitely in component state. This caused the bug where reopening the modal bypassed the list view.

### Decision 3: Deterministic Reference Code Helper with Fallback
- **Rationale**: Compute reference code using the formula: `CSA-{RESOLVED_PREFIX}-{YEAR}-{PERIOD}`.
  - Prefix resolution hierarchy:
    1. Cleaned `bpmCode` (e.g., `FIN-01` -> `FIN01`).
    2. Fallback: Cleaned `noGL` (e.g., `GL110100`).
    3. Tertiary fallback: `PROC-` + first 4 chars of `bpmProcessId` (e.g., `PROC-A8F2`).
- **Alternatives Considered**: Adding a new database column `referenceCode`. Rejected to prevent database schema migration overhead, while deterministic calculation ensures 100% consistency across legacy and newly created assessments.

### Decision 4: Controlled Period Dropdown Synchronized with Fiscal Year
- **Rationale**: Replace the free-text `period` input with a structured quarter selector. The year is automatically taken from the active fiscal year context. The stored string continues to be `{YEAR}-{QUARTER}` (e.g., `2025-Q1`), ensuring existing PDF reports, Excel exports, and filters continue to function without changes.

## Risks / Trade-offs

- **[Risk] `TodoListPage` expects to open CSA tab directly**
  → **Mitigation**: `TodoListPage` will explicitly pass `initialTab="csa"` to `BPMModal`, while `BPMPage` passes `initialTab="worksheet"`.
- **[Risk] Existing CSA records with non-quarter text (e.g., "Januari")**
  → **Mitigation**: The structured selector allows displaying custom legacy values if encountered, while restricting new assessment creation to standard quarters.
