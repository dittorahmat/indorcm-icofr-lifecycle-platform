## Why

The `RegulatoryPropertySheet` experiences flickering and UI instability when users input risk or control descriptions. For risks, it causes a visual flicker (re-mount); for controls, it causes the accordion to collapse immediately upon typing the first character. This is caused by "Unstable Keys" where the React `key` changes from a temporary ID to a permanent ID during the input process, forcing a full re-mount of the component and loss of state.

## What Changes

- Modify `RegulatoryPropertySheet` to use stable keys for Risk and Control items.
- Shift ID generation logic from "on-type" to "on-add" (Generate permanent IDs immediately when the user clicks "Add Risk" or "Add Control").
- Remove the "Smart ID Assignment" logic that triggers identity changes during the `onChange` event.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `rcm-risk-control-accordion`: The accordion items and risk groups must maintain stable identities throughout the editing session to prevent flickering and unintended collapse.

## Impact

- `src/components/rcm/properties/RegulatoryPropertySheet.tsx`: Primary logic for state updates and ID generation.
- `src/components/rcm/BPMEditor.tsx`: Parent component handling the node data updates.
- Data consistency: Ensures every risk/control pair has a valid ID from the moment of creation.
