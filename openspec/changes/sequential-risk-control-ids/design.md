## Context

IndoGRC Pro represents business processes via the `BPMProcess` model and their maps via the React Flow frontend component `BPMEditor.tsx`. Currently, Risk and Control entities created in the visual map are assigned client-side UUIDs as their business IDs, which makes them difficult for auditors to track. This design outlines how we store prefix codes at the process level and dynamically compute sequential IDs during editor operations while ensuring full flexibility and uniqueness constraints.

## Goals / Non-Goals

**Goals:**
- Add `bpmCode` input field to the process creation dialog on `BPMPage.tsx`.
- Prefill/Suggest `bpmCode` by looking up existing processes with matching/similar names.
- Auto-calculate sequential IDs like `R-ACCT-0001` and `C-ACCT-0001` when node pairs are created in the diagram.
- Support fully editable override inputs for these IDs inside the `RegulatoryPropertySheet.tsx` component.
- Ensure backend synchronization resolves and persists custom strings cleanly in `bpm-service.ts`.

**Non-Goals:**
- Automatic batch-renaming of legacy UUID IDs that are already active in the database (they will remain intact).

## Decisions

### 1. Sequential ID Generation Strategy
- **Choice**: Dynamic client-side calculation utilizing a new backend helper route.
- **Alternative**: Pure client-side calculations (cannot coordinate sequence numbers across multiple users concurrently editing other diagrams/FSLIs) or pure backend generation (hides the suggestion from the user until they press save, which limits visibility and the ability to override).
- **Implementation**: Introduce a `/api/bpm-processes/:id/next-sequences` route. The frontend will hit this endpoint when a new node is created in the editor, getting the current maximum sequence number for the process prefix to calculate the suggestion.

### 2. Manual Override Flexibility
- **Choice**: Make the Risk ID and Control ID standard text inputs in the `RegulatoryPropertySheet`.
- **Alternative**: Rigid uneditable labels.
- **Rationale**: Auditors frequently use custom numbering variations (e.g. `R-ACCT-0001-A` or `R-ACCT-0021-X`), which cannot be predicted by a strict sequential algorithm. An editable field provides the required compliance flexibility.

## Risks / Trade-offs

- **Risk**: Concurrent edits might claim the same sequence number before saving.
  - **Mitigation**: The database primary keys and unique indexes on Risk/Control codes will throw a collision error, which the backend will catch and report to the user as a validation failure, preventing corrupt data.
- **Risk**: Non-standard manual inputs breaking sequence parser.
  - **Mitigation**: The sequence calculator regex searches for `R-[bpmCode]-(\d+)` patterns. If none match, it falls back to starting the sequence at `0001`.
