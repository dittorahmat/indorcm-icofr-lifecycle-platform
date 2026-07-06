## 1. Propagate Lock State and Handle Errors in BPMEditor

- [x] 1.1 In [BPMEditor.tsx](file:///C:/backup/indorcm-icofr-lifecycle-platform/src/components/rcm/BPMEditor.tsx), pass the `isLocked` boolean to the `<RegulatoryPropertySheet>` component invocation.
- [x] 1.2 In [BPMEditor.tsx](file:///C:/backup/indorcm-icofr-lifecycle-platform/src/components/rcm/BPMEditor.tsx), configure an `onError` handler for `saveMutation` to display a toast error (`toast.error`) when the server save fails.

## 2. Disable Inputs and Actions in RegulatoryPropertySheet Under Lock

- [x] 2.1 Update `RegulatoryPropertySheetProps` and the signature of `<RegulatoryPropertySheet>` in [RegulatoryPropertySheet.tsx](file:///C:/backup/indorcm-icofr-lifecycle-platform/src/components/rcm/properties/RegulatoryPropertySheet.tsx) to accept an optional `isLocked` prop.
- [x] 2.2 In [RegulatoryPropertySheet.tsx](file:///C:/backup/indorcm-icofr-lifecycle-platform/src/components/rcm/properties/RegulatoryPropertySheet.tsx), render an alert banner at the top of the "Properties" tab content when `isLocked` is true, informing the user that the diagram is read-only.
- [x] 2.3 In [RegulatoryPropertySheet.tsx](file:///C:/backup/indorcm-icofr-lifecycle-platform/src/components/rcm/properties/RegulatoryPropertySheet.tsx), disable the "Add New Risk", "Add Control", "Remove Node", and any Accordion delete triggers when `isLocked` is true.
- [x] 2.4 Ensure all text inputs, textareas, selects, and checkboxes inside [RegulatoryPropertySheet.tsx](file:///C:/backup/indorcm-icofr-lifecycle-platform/src/components/rcm/properties/RegulatoryPropertySheet.tsx) and its child components (like `TLCForm`, `ELCForm`, `ITGCForm`) bind their `disabled` state to `isLocked`.

## 3. Compliance and Build Verification

- [x] 3.1 Verify i18n locales so that all new texts added (like the read-only warning message) are properly translated without hardcoded strings.
- [x] 3.2 Run typescript type checking with `npm run type-check` to verify code integrity.
- [x] 3.3 Run linting validations with `npm run lint`.
- [x] 3.4 Verify compile and build using `npm run build`.
