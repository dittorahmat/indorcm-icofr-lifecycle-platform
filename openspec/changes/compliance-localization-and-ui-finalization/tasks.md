## 1. Database & Schema Synchronization

- [x] 1.1 Update Drizzle schema if needed and run synchronization: `npx drizzle-kit push`
- [x] 1.2 Verify database connectivity and schema integrity after push

## 2. Localization Sweep & Finalization

- [x] 2.1 Audit all `src/pages` and `src/components` for hardcoded string literals
- [x] 2.2 Move hardcoded strings to `src/i18n/locales/id/*.json` and `src/i18n/locales/en/*.json`
- [x] 2.3 Replace literals with `t()` hook calls in React components
- [x] 2.4 Verify multi-language switching works for all newly localized strings

## 3. Unsaved Changes Guard Integration

- [x] 3.1 Review and finalize `useUnsavedChanges` hook and `UnsavedChangesDialog` component
- [x] 3.2 Apply `useUnsavedChanges` to `ScopingPage.tsx`
- [x] 3.3 Apply `useUnsavedChanges` to `BPMPage.tsx`
- [x] 3.4 Apply `useUnsavedChanges` to `RCMTLCPage.tsx` and `RCMELCPage.tsx`
- [x] 3.5 Apply `useUnsavedChanges` to `CSATabContent.tsx` or its parent page

## 4. UI & Navigation Enhancements

- [x] 4.1 Integrate `NotificationBell` into `AppLayout.tsx` header
- [x] 4.2 Reorganize `src/components/app-sidebar.tsx` to align with production navigation requirements
- [x] 4.3 Ensure all menu items (To-do List, CSA Reports, RCM Matrix) have proper icons and translations

## 5. System Validation & Regression Fixing

- [x] 5.1 Run full type checking: `npm run type-check` (or `tsc --noEmit`)
- [x] 5.2 Run linting audit: `npm run lint`
- [x] 5.3 Execute production build: `npm run build`
- [x] 5.4 Fix any errors or regressions discovered during validation
