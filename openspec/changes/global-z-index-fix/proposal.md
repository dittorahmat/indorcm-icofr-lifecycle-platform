## Why

Dropdown menus (Select components) in modal dialogs are currently being rendered behind the dialog overlay/content because of a z-index conflict. This makes forms inside modals unusable when they contain dropdowns. A global fix is required to ensure that all interactive overlay elements (Select, Popover, Command) are correctly layered according to their functional hierarchy.

## What Changes

- **Global Z-Index Realignment**: Update the core UI component library to use a consistent and layered z-index system.
- **Select Component Update**: Elevate `SelectContent` z-index to ensure it appears above `Dialog` and `Sheet`.
- **Popover/Command Component Update**: Ensure search-based dropdowns and popovers also follow the elevated layering.
- **Audit & Refactor**: Identify and remove any local z-index "hacks" that were used to bypass this issue, and refactor for code hygiene.
- **Verification**: Run comprehensive type-checks, linting, tests, and builds to ensure no regressions in API endpoints or imports.

## Capabilities

### New Capabilities
- `ui-layering-integrity`: Establishes the standard for UI element layering, ensuring overlays, modals, and tooltips never collide or hide each other.

### Modified Capabilities
- (None)

## Impact

- `src/components/ui/select.tsx`: Primary fix location.
- `src/components/ui/dialog.tsx`: Baseline for layering comparison.
- `src/components/ui/popover.tsx` & `src/components/ui/command.tsx`: Secondary fix locations for consistent UX.
- All pages/components using `Select` inside `Dialog` (e.g., `ScopingPage.tsx`, `AddSOCReportDialog.tsx`).
