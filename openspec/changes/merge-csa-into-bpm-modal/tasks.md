# Tasks: Merge CSA into BPM Modal

## 1. Schema & Types
- [x] 1.1 Update `CSARecord` interface in `shared/types.ts` with regulatory fields (attributes A-D, transReference).
- [x] 1.2 Update `csaRecords` table in `worker/db/schema.ts` and apply Drizzle migration.

## 2. Backend API
- [x] 2.1 Update `POST /api/csa` to support new fields.
- [x] 2.2 Create `GET /api/bpm-diagrams/by-gl/:noGL` to find diagrams by account.

## 3. UI Refactoring
- [x] 3.1 Create `src/components/bpm/CSATabContent.tsx` with split-panel layout.
- [x] 3.2 Implement the Assessment Form with SK-5 kriteria (Effective/Ineffective/No Transaction).
- [x] 3.3 Integrate `ReactFlow` preview in the left panel with node highlighting logic.
- [x] 3.4 Update `BPMModal.tsx` to rename tab and render `CSATabContent`.

## 4. Feature Migration & Cleanup
- [x] 4.1 Port GPS/Biometric forensic logic from `CSAWorkspace.tsx` to `CSATabContent.tsx`.
- [x] 4.2 Remove `src/pages/csa/CSAWorkspace.tsx` and update sidebar navigation to remove the standalone CSA link.
- [x] 4.3 Verify that clicking "CSA" in the modal correctly highlights the control node in the diagram.
