# Tasks: BPM Standard Alignment

## 1. Data Model & Backend
- [x] 1.1 Update `shared/types.ts` to include `riskIds` in Activity node data.
- [x] 1.2 Implement usage check API `GET /api/bpm/usage-check/:id`.
- [x] 1.3 Add backend validation for "Delete" vs "Unlink" operations.

## 2. React Flow Components
- [x] 2.1 Refactor `BPMEditor.tsx` to use Parent-Child node structure.
- [x] 2.2 Create `DockedIcon` component with badge support.
- [x] 2.3 Implement "Snap-to-Border" logic for child nodes.

## 3. Sidebar & Logic
- [x] 3.1 Overhaul Property Sidebar to handle nested Risk/Control lists.
- [x] 3.2 Implement search-and-select from Library for Risks and Controls.
- [x] 3.3 Create the \"Global Delete Warning\" modal with impact analysis.

## 4. Finalization
- [x] 4.1 Purge/Reset existing BPM Diagram data to new standard.
- [x] 4.2 Validate visual alignment with Lampiran 4 PDF.
- [x] 4.3 Test Many-to-Many syncing between diagram and RCM library.
