## 1. Core Implementation

- [x] 1.1 Create `src/hooks/useUnsavedChanges.ts` with `useBlocker` and `beforeunload` logic.
- [x] 1.2 Create `src/components/ui/UnsavedChangesDialog.tsx` using Shadcn/UI `AlertDialog`.

## 2. Page Integration

- [x] 2.1 Integrate `useUnsavedChanges` into `src/pages/scoping/ScopingPage.tsx` using `simState` as the source for `isDirty`.
- [x] 2.2 Integrate `useUnsavedChanges` into `src/components/rcm/BPMEditor.tsx` by tracking modifications to nodes and edges.
- [x] 2.3 Add `isDirty` tracking to `src/components/rcm/ControlEditor.tsx`.
- [x] 2.4 Add `isDirty` tracking to `src/components/deficiencies/RemediationForm.tsx`.

## 3. Global Configuration

- [x] 3.1 Verify `RootLayout.tsx` handles nested route blocking correctly.
- [x] 3.2 Ensure the confirmation dialog is accessible and styled according to project theme.

## 4. Testing & Validation

- [x] 4.1 Test internal navigation warning by clicking sidebar links on dirty pages.
- [x] 4.2 Test external navigation warning by refreshing the browser on dirty pages.
- [x] 4.3 Verify that saving changes clears the `isDirty` flag and allows navigation without prompts.
