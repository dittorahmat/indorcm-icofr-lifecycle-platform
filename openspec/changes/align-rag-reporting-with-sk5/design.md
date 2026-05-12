## Context

Current implementation of the Test Workbench is a high-level form that captures final test results but lacks the granular sampling evidence required by SK-5 Lampiran 7. Additionally, the Test of Design (TOD) form does not explicitly map to the 6 pillars defined in Lampiran 8. Data model is currently missing support for row-level sample evidence.

## Goals / Non-Goals

**Goals:**
- Implement a relational data model for test samples using Drizzle.
- Create a reusable `RegulatorySamplingTable` component for the UI.
- Standardize the TOD verification form to 6-pilar logic.
- Ensure 100% i18n coverage for regulatory terms.
- Refactor existing test workbench logic for better maintainability (Clean Code).

**Non-Goals:**
- Changing the overall BPM diagramming engine (React Flow).
- Implementing full external KAP audit portal (out of scope for this change).

## Decisions

### 1. Data Model Extension
- **Choice**: Create a new `test_samples` table linked to `test_records`.
- **Rationale**: Keeps the main `test_records` table lean while allowing for unlimited sample evidence per test. This supports the row-per-sample requirement of Lampiran 7.
- **Alternatives**: Storing samples as a JSONB blob in `test_records`. *Rejected* because it's harder to query for aggregate deficiency analytics across samples.

### 2. Zero Tolerance status calculation
- **Choice**: Logic resides in the backend (Worker) and is reflected in the UI.
- **Rationale**: Ensures consistency. If any sample has `status: 'Failed'`, the parent `TestRecord.result` is automatically set to `'Ineffective'`.
- **UI Interaction**: The "Result" dropdown in the UI becomes read-only when samples are present to prevent manual override that violates SK-5.

### 3. Notification System
- **Choice**: Lightweight Event-Driven Notifications.
- **Rationale**: Use a simple `notifications` table to store compliance alerts (e.g., "CSA Due", "Remediation Needed").
- **UI**: A bell icon in the `AppHeader` component.

### 4. Code Refactor Strategy
- **Choice**: Surgical Extraction.
- **Rationale**: Extract logic from `ControlTestCard.tsx` into smaller sub-components (`TODForm`, `TOESamplingTable`, `TestStatusBadge`) to follow the Single Responsibility Principle (SRP).

## Risks / Trade-offs

- [Risk] Database migration might break existing mock data. → [Mitigation] Update `shared/ai-mock-data.ts` to include sample data.
- [Risk] Table-heavy UI might be difficult to use on small screens. → [Mitigation] Implement a "Full Screen" or "Sheet" mode for the sampling grid.

## Migration Plan

1. Define new Drizzle schema changes.
2. Run `npx drizzle-kit push` to update local/dev DB.
3. Update `shared/types.ts` to reflect the new structure.
4. Backfill existing test records with at least one "summary sample" if necessary to maintain integrity.
