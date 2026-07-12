## Why

There are multiple occurrences of native window `confirm()` calls across the codebase for confirming critical destructive operations (such as resetting scoping data, deleting BPM processes, removing applications from libraries, and deleting documents). Furthermore, the recently added Scoping Page delete confirmation uses duplicate localized component states. A unified global programmatic confirm hook (`useConfirm`) will standardize the visual presentation to a premium Shadcn/UI `<AlertDialog>` while minimizing duplicate boilerplate.

## What Changes

- Create a reusable `ConfirmProvider` and a custom hook `useConfirm` that allows triggering premium styled alert dialogs programmatically.
- Register `ConfirmProvider` in the app's root entry points.
- Refactor the recently implemented delete confirmations on `ScopingPage.tsx` to use this hook instead of local states.
- Replace all native `window.confirm()` calls across the application (in scoping, BPM, ELC, ELC workflow, and documents) with the `useConfirm` hook.

## Capabilities

### New Capabilities
- `global-confirm-dialog`: The provider, hook, and AlertDialog components that enable programmatic confirmation overlays.

### Modified Capabilities
- `secure-delete-confirmations`: Refactors the recently added scoping deletions to utilize the unified global hook.

## Impact

- `src/components/providers/ConfirmProvider.tsx`: New provider component.
- `src/hooks/use-confirm.ts`: New custom hook.
- `src/main.tsx` / `src/App.tsx`: App layout root wrapping with the new provider.
- `ScopingPage.tsx`, `BPMPage.tsx`, `BPMWorksheet.tsx`, `use-csa.ts`, `SOCMonitoringPage.tsx`, `DocumentsPage.tsx`: Component/hook refactorings to use the new hook.
