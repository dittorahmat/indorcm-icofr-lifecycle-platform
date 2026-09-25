## Why

In `BPMModal.tsx`, the Lampiran 6 tab (`Lampiran6LogView`) is currently rendering empty because it filters change logs with `l.entityId !== entityId`, where `entityId` is passed as `noGL` (a GL account number), while the change logs recorded in `audit_logs` store control UUIDs or diagram UUIDs as their `entityId`. 

To align with Regulation SK-5/DKU.MBU/11/2024 Lampiran 6 requirements and user expectations, the log view inside BPM modal must focus on all approved/regulatory changes relevant to the specific **Business Sub-Process and Diagram**, allowing control owners and evaluators to review the historical evolution of controls and process flow within that exact process context.

## What Changes

- Modify `BPMModal.tsx` to pass `bpmProcessId` and `subProcessName` (and optionally diagram context) to `Lampiran6LogView`.
- Refactor `Lampiran6LogView.tsx` filtering logic:
  - Eliminate the strict `l.entityId !== noGL` constraint.
  - Match logs where `dataAfter.subProcess` / `dataBefore.subProcess` matches the active sub-process, OR `dataAfter.bpmProcessId` / `dataBefore.bpmProcessId` matches the active process ID, OR `l.entityId` equals the process/diagram ID.
  - Support fiscal year filtering consistently.
  - Display informative empty and fallback states if no approved regulatory changes exist for that sub-process.
- Ensure backend audit logging snapshots in `ControlService` and `BpmService` preserve `subProcess` and `bpmProcessId` so future change events are consistently queryable.

## Capabilities

### New Capabilities
- `lampiran-6-subprocess-log`: Filtering and displaying regulatory change logs (Lampiran 6) scoped to a specific business sub-process and BPM diagram context.

### Modified Capabilities
- None

## Impact

- Affected frontend components:
  - `src/components/bpm/BPMModal.tsx`
  - `src/components/bpm/Lampiran6LogView.tsx`
- Affected backend services:
  - `worker/services/control-service.ts` (ensuring `bpmProcessId` & `subProcess` are captured in change log snapshots)
  - `worker/routes/audit.ts` / `worker/services/bpm-service.ts`
