## Why

Currently, Risk and Control IDs in IndoGRC Pro are generated as random UUID substrings (e.g. `R-a38f92bd`), making them hard for human auditors to track, report, and reconcile. This proposal introduces structured, sequential IDs (e.g., `R-ACCT-0001` and `C-ACCT-0001`) that map directly to the corresponding business process's department or custom prefix code (`bpmCode`), ensuring full alignment with BUMN standardization under **Regulation SK-5/DKU.MBU/11/2024**.

## What Changes

- **BPM Process Creation UI**: Add a "BPM Code" text input field (defaulting to a suggestion based on assigned departments or past processes) in the "+ Create Process" dialog on the main BPM page.
- **BPM Editor Node Addition**: Automatically assign structured sequential IDs (`R-[bpmCode]-[0001-9999]`) when adding new Risk/Control node pairs within a process diagram.
- **Sequential Sequence Logic**: Introduce a smart counter query on the backend to retrieve the next available sequence number for a given prefix pattern.
- **ID Overrides**: Maintain fully editable ID input boxes in the Property Sheet (`RegulatoryPropertySheet`) to allow manual numbering deviations and sub-numbering (e.g., `R-ACCT-0001-A`) while enforcing uniqueness at the database/API level.

## Capabilities

### New Capabilities
- `sequential-risk-control-ids`: Provides structured prefix configuration for BPM processes, smart sequential numbering lookup, and manual override capabilities for Risk and Control IDs in diagram sheets.

### Modified Capabilities
- `bpm-execution-hub`: Modifying node creation and saving logic to incorporate structured, custom ID properties into process map entities.

## Impact

- **UI Components**: `BPMPage.tsx`, `BPMEditor.tsx`, `RegulatoryPropertySheet.tsx`
- **Database Service**: `worker/services/bpm-service.ts`
- **API Endpoints**: `/api/bpm-processes` (creation payload updates) and new `/api/bpm-processes/:id/next-sequences` route.
