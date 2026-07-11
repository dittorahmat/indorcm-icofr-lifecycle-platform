## Why

Users experience UI lag and sluggish performance when editing materiality parameters (OM percentage, Haircut percentage, and Basis). This is because the calculations (which iterate over thousands of General Ledger rows, classify scoping reasons, and check compliance) run synchronously on every keystroke. This change introduces a manual "Recalculate" trigger to perform calculations only when explicitly requested, decoupling input fields from immediate heavy data-processing.

## What Changes

- Decouple the materiality parameter input fields (OM%, Haircut%, Basis) from immediate, synchronous recalculation.
- Add a "Recalculate" button to `MaterialityParamsCard` which becomes active when the input values are modified (stale state).
- Introduce a visual "Pending Recalculation" (stale) state for the workspace editor (e.g., table data, metrics) when local parameter changes haven't been calculated.
- Show a loading spinner/overlay with a "Recalculating..." description during the computation block to give users explicit feedback that calculations are running.

## Capabilities

### New Capabilities
- `materiality-recalculation-trigger`: Introduces the explicit user trigger for materiality and scoping calculations, along with stale-state tracking and progress indicators.

### Modified Capabilities

## Impact

- `src/pages/scoping/hooks/useScopingPage.ts` (modifying `useScopingEditor` to keep track of local/draft inputs and stale state).
- `src/pages/scoping/components/MaterialityParamsCard.tsx` (adding the "Recalculate" button and handling local inputs).
- `src/pages/scoping/components/ScopingEditorContent.tsx` (showing loading state/spinner and stale indicators for the scoping grid).
- `src/pages/scoping/ScopingPage.tsx` (main shell container styling and passing parameters).
