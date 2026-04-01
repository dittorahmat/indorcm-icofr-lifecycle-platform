# Proposal: Update CSA Result Options

## Why
The current "Pass, Fail, N/A" options for Control Self Assessment (CSA) do not align with the user's requirement for a risk-based rating system (High, Medium, Low) with visual color coding.

## What Changes
- Change CSA assessment result options from "Pass, Fail, N/A" to "High, Medium, Low".
- Apply background colors to the radio button options in the UI:
  - High: Red background
  - Medium: Yellow background
  - Low: Green background
- Update data models and validation schemas to reflect these new options.
- Ensure backend/logic that previously checked for 'Fail' now checks for 'High' (or 'Medium') if applicable for triggering deficiencies.

## Capabilities

### New Capabilities
- `csa-result-options`: Redefined rating system for CSA records.

### Modified Capabilities
- None

## Impact
- `shared/types.ts`: `CSARecord` interface updated.
- `src/pages/csa/CSAWorkspace.tsx`: UI and validation schema updated.
- Any reporting or dashboard that relies on Pass/Fail status (to be investigated).
