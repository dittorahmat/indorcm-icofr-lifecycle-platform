## Why

Users have reported losing data when accidentally navigating away from pages like Scoping or BPM Editor without saving their changes. This change introduces a "double-layer" safety mechanism to prevent unintentional data loss by warning users when they attempt to navigate away with unsaved changes.

## What Changes

- **Internal Navigation Guard**: Implementation of a React Router `useBlocker` or equivalent mechanism to intercept internal route changes and show a confirmation dialog.
- **External Navigation Guard**: Implementation of a `beforeunload` event listener to catch browser-level events (tab close, refresh, back button).
- **Standardized `isDirty` State**: Integration of form "dirty" states and manual state tracking into the warning system.
- **Global `useUnsavedChanges` Hook**: A reusable hook to easily add this protection to any page or component.
- **Confirmation Dialog**: A polished UI component (using Shadcn/UI) for internal navigation warnings.

## Capabilities

### New Capabilities
- `unsaved-changes-guard`: Ability to detect and warn users about unsaved changes during internal and external navigation.

### Modified Capabilities
- `scoping-management`: Requirements modified to ensure materiality simulations and qualitative assessments are protected from data loss.
- `rcm-bpm-visualization`: Requirements modified to ensure BPM diagram edits are protected from data loss.

## Impact

- `src/components/layout/RootLayout.tsx`: Potential integration for global listeners.
- `src/pages/scoping/ScopingPage.tsx`: Implementation of the guard.
- `src/components/rcm/BPMEditor.tsx`: Implementation of the guard.
- `src/hooks/`: New `useUnsavedChanges.ts` hook.
- `src/components/ui/`: New confirmation dialog component if not using standard `AlertDialog`.
