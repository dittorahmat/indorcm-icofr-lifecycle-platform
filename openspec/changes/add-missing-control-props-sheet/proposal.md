## Why

In the BPM Editor's Regulatory Property Sheet (`src/components/rcm/properties/RegulatoryPropertySheet.tsx`), key control metadata fields—specifically Control Type (`controlType`), Control Nature (`controlNature`), and Frequency (`frequency`)—are missing from the node control property form. Although these fields are supported in RCM data schemas and present in `VerificationEditDialog` and `RCMEditDialog`, users cannot view or edit them directly within the BPM property sheet when performing design verification.

## What Changes

- Add Control Type (`controlType`), Control Nature (`controlNature`), and Frequency (`frequency`) dropdown fields to each control item rendered in `RegulatoryPropertySheet.tsx`.
- Pass updated values (`controlType`, `controlNature`, `frequency`) through `updateSpecificControl` helper to update the node's `regulatoryPairs` data.
- Support default fallbacks when initializing new control pairs in `addNewRisk` and `addControlToRisk`.
- Ensure full localization (i18n) for all option labels and field titles across Indonesian and English locales.

## Capabilities

### New Capabilities
- `bpm-control-properties-expansion`: Extends the control property inputs in `RegulatoryPropertySheet` to include Control Type, Control Nature, and Frequency.

### Modified Capabilities

## Impact

- `src/components/rcm/properties/RegulatoryPropertySheet.tsx`: Add form inputs and bind values to `regulatoryPairs` state.
- Locale files (`src/i18n/locales/id/rcm.json`, `src/i18n/locales/en/rcm.json` if additional keys needed).
