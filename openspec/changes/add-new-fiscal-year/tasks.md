## 1. State Management

- [x] 1.1 Update `FiscalYearState` in `src/store/useFiscalYearStore.ts` to include `customYears` array and `addCustomYear` action
- [x] 1.2 Update initial state loading and merge behavior in `src/store/useFiscalYearStore.ts` to preserve custom years
- [x] 1.3 Update or add unit tests for `useFiscalYearStore` to cover custom year addition and storage in `src/store/__tests__/useFiscalYearStore.test.ts`

## 2. UI Integration & Interaction

- [x] 2.1 Update `FiscalYearSelector.tsx` to read, display, and merge `customYears` with the standard calculated year range
- [x] 2.2 Add the "+ Tambah Tahun Baru" SelectItem at the bottom of the Select list in `src/components/layout/FiscalYearSelector.tsx`
- [x] 2.3 Create a Dialog/Modal within `FiscalYearSelector.tsx` (using shadcn Dialog) to let users input and submit a new fiscal year
- [x] 2.4 Add validation (4-digit check, duplicate prevention) in the Dialog/Modal before saving the year and setting it as the `workingYear`
- [x] 2.5 Add localized copy for the "+ Tambah Tahun Baru" and Dialog elements in both English and Indonesian locales (`src/i18n/locales/en/common.json`, `src/i18n/locales/id/common.json`, etc.)

## 3. Verification & Compliance

- [x] 3.1 Run `npm run type-check` to verify TypeScript types
- [x] 3.2 Run `npm run lint` and verify lint rules pass
- [x] 3.3 Run `npm run build` to verify compilation
- [x] 3.4 Run `npm test` to verify no test regression
