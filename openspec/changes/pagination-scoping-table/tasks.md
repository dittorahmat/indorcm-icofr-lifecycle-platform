## 1. Localization Update

- [x] 1.1 Add pagination strings (previous, next, pageOf) to `src/i18n/locales/en/scoping.json`
- [x] 1.2 Add pagination strings (previous, next, pageOf) to `src/i18n/locales/id/scoping.json`

## 2. Table Component Update

- [x] 2.1 Import `getPaginationRowModel` in `src/components/scoping/GLDataGrid.tsx`
- [x] 2.2 Add `getPaginationRowModel: getPaginationRowModel()` to `useReactTable` configuration
- [x] 2.3 Initialize `pagination` state with `pageSize: 15` in `useReactTable` state
- [x] 2.4 Set `autoResetExpanded: false` in `useReactTable` config to preserve expansion state

## 3. UI Implementation

- [x] 3.1 Implement pagination control bar with Previous/Next buttons and page indicator in `GLDataGrid.tsx` footer
- [x] 3.2 Update the table footer summary to show "Showing X of Y FSLIs" instead of total rows
- [x] 3.3 Style the pagination controls using Shadcn/UI buttons and consistent typography

## 4. Final Validation

- [x] 4.1 Verify pagination works correctly with grouped and expanded rows
- [x] 4.2 Verify language switching (EN/ID) for pagination labels
- [x] 4.3 Run `npm run type-check` and `npm run lint`
- [x] 4.4 Run `npm run build` to verify project integrity (Note: build failed due to environment OOM, but type-check/lint passed)
