## Context

Currently, the `CSAPage` displays a history of signed-off CSA records. Line 2 (Fungsi ICOFR) needs a structured way to review these records, specifically performing a *Test of Design* (TOD) for each control involved in the process, as mandated by Lampiran 8 of SK-5. The current UI lacks the granular visibility into samples and the ability to capture Line 2's specific evaluation criteria.

## Goals / Non-Goals

**Goals:**
- Implement a hierarchical UI in `CSAPage` using expandable rows.
- Build a transposed matrix view (Controls as Y-axis, Samples as X-axis).
- Create a standardized Lampiran 8 TOD form as a modal with full Risk Context.
- Establish a persistent storage layer for TOD results with free-text justification.
- Implement the "Unsaved Changes" pattern for the new form.
- Add notification triggers for Line 1 -> Line 2 handoffs.

**Non-Goals:**
- Modifying the existing Line 1 CSA data model.
- Implementing Test of Operating Effectiveness (TOE) in this phase (focus is TOD).
- Redesigning the RCM master data management.

## Decisions

### 1. Database Schema (`tod_evaluations`)
We will add a new table to store Line 2's review results.
- **Decision**: Use `text` fields for the 6 evaluation pillars to capture auditor justifications.
- **Rationale**: Boolean flags do not satisfy the regulatory requirement for "evaluation results" which require a summary of the assessment per pilar.
- **Columns**: `id`, `csaId`, `controlId`, `evaluatorId`, `pilarObjective`..`pilarEvidence` (text), `conclusion` (enum), `comment` (text), `kkReference` (text).

### 2. Transposed Matrix UI
- **Decision**: Implement a `CSAReviewMatrix` component that takes a `CSARecord` and pivots its `samples`.
- **Rationale**: The standard matrix in `CSATabContent` is optimized for entry (Samples as rows). For review, seeing how a single Control performed across all samples is more intuitive for finding systemic design failures.

### 3. Lampiran 8 Popup
- **Decision**: Use a dedicated `TODVerificationDialog` component.
- **Pre-population**: Use a `useQuery` to fetch the master `Control` data AND its parent `RCM` record.
- **UI Layout**: 
    - **Risk Box**: Prominently display Risk Description, Fraud Related flag, and Risk Rating.
    - **Control Box**: Display IPOs and Financial Assertions.
    - **Assessment**: 6 Vertical text area fields for pillar-by-pillar justification.

### 4. Notification Integration
- **Decision**: Hook into the `CSASubmit` mutation in the backend to push a record into the `notifications` table for users with the `Line 2` role.
- **Rationale**: Keeps the notification logic server-side for consistency.

### 5. Code Hygiene and Refactoring
- **Decision**: Refactor `CSAPage.tsx` by extracting the table body into a `CSARecordRow` component to manage expansion state and nested rendering cleanly.
- **Rationale**: Prevents `CSAPage` from becoming a "mega-file" (SOLID/Single Responsibility).

## Risks / Trade-offs

- **[Risk]**: High number of samples (e.g., 60+) making the matrix horizontally unwieldy.
  → **Mitigation**: Implement "Sticky Columns" for the Control ID/Name and use a horizontal scroll area for sample columns.
- **[Risk]**: Disconnect between RCM changes and existing TOD records.
  → **Mitigation**: Store a snapshot of control attributes in the `tod_evaluations` record or clearly version the RCM. For this phase, we will link to the current control but display a warning if the control has been modified post-evaluation.
