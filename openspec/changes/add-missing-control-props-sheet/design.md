## Context

In `RegulatoryPropertySheet.tsx`, each control item currently includes inputs for `classification`, `controlId`, `controlDescription`, `isKeyControl`, and classification-specific forms (`TLCForm`, `ELCForm`, `ITGCForm`). However, essential control attributes (`controlType`, `controlNature`, `frequency`) are missing from this sheet, creating an inconsistency with `VerificationEditDialog.tsx` and `RCMEditDialog.tsx`.

## Goals / Non-Goals

**Goals:**
- Add UI controls for `controlType`, `controlNature`, and `frequency` to `RegulatoryPropertySheet.tsx`.
- Bind values to `updateSpecificControl` so that edits update the parent node's `regulatoryPairs`.
- Maintain full localization (i18n) and accessibility.
- Support default value initializations in `addNewRisk` and `addControlToRisk`.

**Non-Goals:**
- Schema changes to backend Durable Objects or DB tables (as `controlType`, `controlNature`, and `frequency` are already part of the control data structure).

## Decisions

- **Placement in Control Accordion**: Place the three fields above the sub-form (`TLCForm` / `ELCForm` / `ITGCForm`) inside the control accordion content, styled consistently with Shadcn UI `Select` and `Label`.
- **Options Alignment**: Align dropdown values with standard options in `VerificationEditDialog.tsx` and `i18n` locale keys.

## Risks / Trade-offs

- **[Risk] Existing nodes with undefined fields**: Control objects stored in existing nodes might have `undefined` or `null` for `controlType`, `controlNature`, or `frequency`.
  - *Mitigation*: Fallback to empty string `''` or standard defaults in `Select` value props.
