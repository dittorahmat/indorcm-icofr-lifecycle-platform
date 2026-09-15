## Context

See proposal.md - Why.
In `CSAPage.tsx`, `matrixData` is fetched via `/api/rcm-matrix/tlc?bpmProcessId=...`. This endpoint joins `rcm_controls` with `rcms` and `controls`, returning one record per risk-control mapping. Multi-risk controls produce multiple elements with the same `controlId`. The review matrix (`CSAReviewMatrix.tsx`) maps over `controls` directly and associates TOD evaluations and sample test outcomes by `controlId`.

## Goals / Non-Goals

**Goals:**
- Ensure each control is rendered exactly once per sub-process in the CSA Review Matrix.
- Keep `TODVerificationDialog` functional (it uses `mappingId` to query contextual details and syncs design changes).
- Improve header formatting in `CSAReviewMatrix.tsx` so `sampleRef` is distinguishable and readable.

**Non-Goals:**
- Modify backend endpoint `/api/rcm-matrix/tlc` or affect the RCM TLC matrix page where mapping rows per risk are necessary.
- Modify database schema or migrate historical CSA data.

## Decisions

### 1. Frontend Deduplication via `useMemo` in `CSAPage.tsx`
- **Choice**: Filter `matrixData.items` by unique `controlId` using a `Set` in `useMemo`.
- **Rationale**: Zero side-effects on other consumers of `/api/rcm-matrix/tlc` (e.g. `RCMTLCPage.tsx`, `BPMEditor.tsx`). Fast and cleanly scoped to the CSA Review Matrix.
- **Alternative considered**: Add `?distinctControl=true` query param on backend. Discarded because frontend deduplication is simpler, immediate, and does not alter backend query semantics.

### 2. Retain Primary `mappingId` for Dialog Interactivity
- **Choice**: The deduplication retains the first mapped occurrence for each `controlId`.
- **Rationale**: `TODVerificationDialog` expects a `control` object with `mappingId` and `controlId`. Using the first mapping entry ensures dialog opening and dual-sync (`/api/rcm-matrix/tlc/batch-update`) continue working seamlessly.

### 3. Enhanced Sample Column Header Layout
- **Choice**: Redesign `TableHead` in `CSAReviewMatrix.tsx` to display an identifiable badge/pill for sample reference with min-width adjustments and tooltip fallback.
- **Rationale**: Eliminates aggressive truncation (`max-w-[120px]`) and visually distinguishes the transaction reference from the "Evidence" sub-label.

## Risks / Trade-offs

- **[Multi-risk context omitted in review row]** → The review matrix focuses on control design and execution effectiveness; detailed risk mapping is already available in the RCM Matrix view and the TOD verification modal.
