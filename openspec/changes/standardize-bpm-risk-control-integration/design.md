## Context

The BPM Editor is the primary visual tool for ICOFR documentation. To ensure alignment with the Risk Library (Appendix 2) and RCM Manager (Bab III), we need to unify the "Add" experience.

## Goals / Non-Goals

**Goals:**
- Enforce data consistency by linking to existing Master Data.
- Improve selection speed via search filters.
- Integrate the recently implemented Risk Library.

**Non-Goals:**
- Changing the backend schema (existing RCM/Control tables support these links).

## Decisions

### 1. UI Refactor
**Decision:** Replace standard `<Select>` with a searchable list or integrated `RiskLibraryLookup` trigger in the BPM Sidebar.
**Rationale:** Standard selects fail when the list exceeds 20+ items.

### 2. Risk Entry Workflow
**Decision:** Clicking "+ Add Risk" will now open the `RiskLibraryLookup`. Selecting an item from the library will automatically create the `rcms` instance linked to the current sub-process.

## Risks / Trade-offs

- **[Risk] User Friction** → **[Mitigation]** Ensure the search is fast and the library is well-seeded.
