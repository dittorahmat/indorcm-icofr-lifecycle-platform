## Why

Current CSA assessment requires one evidence upload per transaction sample, which is insufficient because a single transaction may need to be verified against multiple controls. To comply with SK-5 audit standards, every "Verification Point" (the intersection of a Transaction and a Control) must have its own evidence, status, and remarks. This change refactors the CSA interface to support this granular requirement.

## What Changes

- **Dual-Table Assessment Interface**: Retain the existing Matrix Table (Samples as rows, Controls as columns) for a summary "Pass/Fail" view, but add a new **Granular Evidence Table** below it.
- **Flattened Verification Table**: The new second table will list every unique combination of `Transaction x Risk x Control` as an individual row.
- **Granular Evidence Binding**: Move the evidence upload functionality from the first table to the new granular table. Each verification row will have its own upload button, status indicator, and remark field.
- **Workflow-Driven Content**: Risks and Controls in the second table will be automatically populated from the associated BPM workflow nodes.
- **Mandatory Evidence Logic**: All verification points in the second table must have evidence or a valid justification before sign-off.
- **Enhanced Data Structure**: Update the JSONB schema for `controlResults` to store granular metadata (evidence URL, individual comments, and pass/fail status) for each control per sample.

## Capabilities

### New Capabilities
- `granular-csa-verification`: The ability to manage and document audit evidence at the most granular level (Transaction-Control intersection).

### Modified Capabilities
- `csa-management`: Update the assessment workflow to enforce granular verification requirements.

## Impact

- `src/components/bpm/CSATabContent.tsx`: Major UI refactor of the assessment table.
- `shared/types.ts`: Update `CSATestSample` and related JSONB structure definitions.
- `worker/user-routes.ts`: Update `POST /api/csa` to handle granular result arrays.
