## 1. CSA Workspace Update

- [x] 1.1 Add "Risk Control" tab trigger to `CSAWorkspace.tsx`.
- [x] 1.2 Copy necessary state and hooks from `RCMList.tsx` into `CSAWorkspace.tsx` (Queries for RCM, Controls, etc.).
- [x] 1.3 Port the `RCM Matrix` UI logic (search, cards, table) into the new tab content in `CSAWorkspace.tsx`.
- [x] 1.4 Port the `BPM Dialog`, `Add Process Dialog`, and `ControlEditor` logic into `CSAWorkspace.tsx`.

## 2. Navigation Cleanup

- [x] 2.1 Remove the `RCM` item from `navItems` in `src/components/layout/MainHeader.tsx`.
- [x] 2.2 Remove `rcm` and `change-log` items from `src/components/app-sidebar.tsx`.

## 3. Verification

- [x] 3.1 Verify that the "Risk Control" tab in CSA functions exactly like the previous RCM page.
- [x] 3.2 Ensure adding a process/control still works correctly.
- [x] 3.3 Verify the header and sidebar no longer show redundant RCM links.
