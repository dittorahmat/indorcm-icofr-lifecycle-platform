## Why

User needs better data organization in the Scoping/Simulation worksheet to align with standardized GL sorting orders and to maximize screen real-estate when analyzing wide financial data tables. Current layout wastes space on the right and doesn't support the required regulatory sorting order based on `noUrut`.

## What Changes

- **Sorting Logic**: Implement hierarchical sorting for the Scoping worksheet. FSLIs will be sorted based on the minimum `noUrut` of their constituent GL accounts. GL accounts within each FSLI will be sorted by their own `noUrut`.
- **UI Layout Overhaul**: 
  - Relocate the Scoping Parameters card (OM/PM/Haircut) from the right sidebar to a left-side panel.
  - Implement a collapsible toggle for the Parameters panel to allow the `GLDataGrid` to expand to full width.
  - Ensure the collapsed/expanded state is controlled by a user-triggered toggle, not automated.
- **Visual Polish**: 
  - Display the `noUrut` column by default for transparency.
  - Refactor `ScopingEditor` in `ScopingPage.tsx` to handle the new sidebar layout.

## Capabilities

### New Capabilities
- `collapsible-scoping-sidebar`: New UI pattern for the Scoping worksheet allowing a collapsible left parameters panel.
- `hierarchical-gl-sorting`: standardized sorting logic for FSLI and GL rows based on numeric order.

### Modified Capabilities
- `gl-integration`: Update data handling to ensure `noUrut` is consistently available and utilized for presentation.

## Impact

- **Frontend**: `src/pages/scoping/ScopingPage.tsx`, `src/components/scoping/GLDataGrid.tsx`.
- **Logic**: `src/lib/compliance-utils.ts` (if sorting helpers are moved there).
- **UX**: Significant improvement in table readability and usable workspace area.
