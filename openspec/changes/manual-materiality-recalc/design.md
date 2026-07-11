## Context

The ICOFR Scoping Matrix page (`ScopingPage.tsx` and its child editor `ScopingEditor`) calculates materiality (OM, PM, significant accounts, and scoping compliance) dynamically using `useScopingEditor` hook from `useScopingPage.ts`. The calculation loops through the entire General Ledger (GL) row dataset, maps category rollups, evaluates compliance, and updates classifications. When materiality input parameters are modified (such as typing percent values), the calculations run synchronously on every keystroke, causing blocking UI lag.

## Goals / Non-Goals

**Goals:**
- Decouple parameter inputs (OM%, Haircut%, and Basis) from immediate, synchronous recalculation.
- Add local draft states to hold modified parameter inputs during editing.
- Display a "Recalculate" action to trigger the calculation pipeline manually using the draft parameters.
- Provide clear visual indicators when parameter inputs are stale (modified but not calculated).
- Add loading state visual feedback during the recalculation block.

**Non-Goals:**
- Persisting temporary draft parameters to the backend database.
- Modifying the core calculation functions in `materiality-calc.ts`.

## Decisions

### Decision 1: Localized Draft States in MaterialityParamsCard
To prevent full-page re-renders of the large scoping grid and table on every keystroke, draft states (`draftOmPercentage` and `draftHaircutPercentage`) will be kept entirely local to the `MaterialityParamsCard` component:
- `localOm` (number)
- `localHaircut` (number)

These values will map directly to the `<Input />` elements. When the user clicks "Recalculate", these local values are passed to a callback `handleRecalculate(om, haircut)` exposed by the parent hook, which then commits them to the active state. This keeps input typing extremely responsive.

### Decision 2: Stale State Detection and Visual Warning
A boolean `isStale` will be computed by comparing the draft values to the active values:
```typescript
const isStale = draftBasis !== simState.basis ||
                draftOmPercentage !== simState.omPercentage ||
                draftHaircutPercentage !== simState.haircutPercentage;
```
When `isStale` is true, the Recalculate button is enabled, and a warning alert is displayed in `MaterialityParamsCard`. Additionally, the scoping grid in `ScopingEditorContent` will display a subtle overlay or stale banner to inform the user that the shown matrix is pending recalculation.

### Decision 3: Recalculation Spinner & Transition
We will introduce an `isRecalculating` boolean state. When the user clicks "Recalculate":
1. Set `isRecalculating` to `true`.
2. Schedule a short timeout (e.g., 500ms) to allow the loading spinner to render and simulate calculation processing.
3. Update `simState` and the active calculation parameters (which triggers the React `useMemo` calculation synchronously).
4. Set `isRecalculating` to `false`.

During `isRecalculating === true`, `ScopingEditorContent` will render a loading spinner overlay.

## Risks / Trade-offs

- **[Risk]** User saves the simulation with stale parameters (draft parameters not calculated).
  - *Mitigation*: The `onSave` handler in `useScopingEditor` will automatically apply draft changes and recalculate before performing the save request.
