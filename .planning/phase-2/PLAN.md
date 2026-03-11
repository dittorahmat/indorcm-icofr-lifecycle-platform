# Phase 2: BPM & RCM Integration - Implementation Plan

## Step 1: Standardize BPM Node Shapes (Lampiran 3)
- [ ] Refactor `BPMEditor.tsx` custom nodes to use SVG-based paths for perfect Hexagons (Risk) and Ovals (Start/End).
- [ ] Implement "Connection Validation": Risks must be linked to at least one Control Point.
- [ ] Add "Tooltips" or "Sidebars" to nodes to show detailed RCM metadata (assertions, control description).

## Step 2: Formalize Change Management Workflow (Lampiran 6)
- [ ] Update `worker/user-routes.ts` to create a `ChangeLog` record whenever a `Pending Change Approval` is approved.
- [ ] Implement automatic "Diff" generation for changes (comparing `proposedData` with current state) to populate `descriptionBefore` and `descriptionAfter`.
- [ ] Update `src/pages/rcm/ChangeLogPage.tsx` to fetch real data from `/api/changelogs` instead of using mock logs.

## Step 3: BPM-RCM Metadata Sync
- [ ] Allow users to link existing Controls to "Control Point" nodes in the BPM.
- [ ] Ensure that updating a Risk description in the RCM list updates the corresponding "Risk Node" label in the BPM diagram.
- [ ] Implement a "Sync Check" UI to alert users if the BPM and RCM are out of alignment.

## Step 4: Line 1 / Line 2 UI Hardening
- [ ] Enhance the "Proposed Changes" view in `RCMList.tsx` to show a side-by-side comparison of current vs. proposed BPM/RCM.
- [ ] Add a "Reject Change" button for Line 2 with a requirement for feedback comments.

## Verification Plan
- [ ] E2E Test: Line 1 modifies a BPM flow -> Line 2 approves -> Verify record exists in Change Log page.
- [ ] Visual Audit: Verify all BPM shapes match Regulation SK-5 Lampiran 3.
- [ ] Regression: Ensure existing RCM data is preserved during the metadata sync upgrade.
