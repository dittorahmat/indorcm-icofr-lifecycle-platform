## 1. Confirm Provider & Hook Setup

- [x] 1.1 Create `src/components/providers/ConfirmProvider.tsx` containing the React Context, UI modal rendering, and provider definition
- [x] 1.2 Create `src/hooks/use-confirm.ts` exporting the custom hook
- [x] 1.3 Register `ConfirmProvider` in the entry point `src/App.tsx` (wrap the App layout tree)

## 2. Refactor Scoping Page Confirmation

- [x] 2.1 Refactor `ScopingPage.tsx` to use `useConfirm` instead of localized component state hooks (`deleteSimId`, `deleteSnapId`) and remove the inline `<AlertDialog>` JSX elements
- [x] 2.2 Replace scoping purge data native confirm (`confirm(t('scoping:purgeConfirm'))`) with `useConfirm`

## 3. Replace Remaining window.confirm() Calls

- [x] 3.1 Replace native confirm in `BPMPage.tsx` for deleting a BPM process
- [x] 3.2 Replace native confirm in `BPMWorksheet.tsx` for deleting a control row
- [x] 3.3 Replace native confirm in `use-csa.ts` for deleting an assessment
- [x] 3.4 Replace native confirm in `SOCMonitoringPage.tsx` for removing an application from the library
- [x] 3.5 Replace native confirm in `DocumentsPage.tsx` for deleting a document

## 4. Verification & QA

- [x] 4.1 Run TypeScript verification: `npm run type-check`
- [x] 4.2 Run linter verification: `npm run lint`
- [x] 4.3 Run production compilation check: `npm run build`
