## 1. Setup & Infrastructure

- [ ] 1.1 Analyze `drizzle/schema.ts` for any missing metadata fields required by RCM pages
- [ ] 1.2 Generate and run Drizzle migration using `npx drizzle-kit push` if schema changes are identified
- [ ] 1.3 Create `src/i18n/rcm.json` for RCM-specific localizations (ELC, TLC, ITGC headers and form labels)
- [ ] 1.4 Register `rcm.json` in i18n initialization logic

## 2. Reusable Component Development

- [ ] 2.1 Develop `RCMTable` component with support for sticky columns and multi-level headers
- [ ] 2.2 Implement `RCMGroupHeader` row pattern to break row flow by Process/Sub-process
- [ ] 2.3 Implement vertical eye-tracking guides (every 5 columns) and reinforced horizontal borders in `src/components/ui/table.tsx` or `RCMTable`
- [ ] 2.4 Develop `RCMEditDialog` with a 3-section tabbed layout (General, Risk/Control, Compliance)
- [ ] 2.5 Integrate `useUnsavedChanges` hook into `RCMEditDialog` to guard against accidental modal closure

## 3. Page Refactoring & Standardization

- [ ] 3.1 Refactor `RCMELCPage.tsx` to use the standardized `RCMTable` and `RCMEditDialog`
- [ ] 3.2 Refactor `RCMTLCPage.tsx` to use the standardized `RCMTable` and `RCMEditDialog`
- [ ] 3.3 Refactor `RCMITGCPage.tsx` to use the standardized `RCMTable` and `RCMEditDialog`
- [ ] 3.4 Apply standardized typography scale (`font-mono` for codes, `text-xs` for narratives, `semibold` headers) across all pages
- [ ] 3.5 Remove redundant "Action" columns from the right side of the matrices

## 4. UI Polish & Global Features

- [ ] 4.1 Update Sidebar navigation if any RCM links need re-labeling or regrouping
- [ ] 4.2 Implement/Integrate global Notification Bell in `AppLayout.tsx` for system-wide status updates
- [ ] 4.3 Audit all RCM pages for "code smells", unused imports, and broken API endpoints after refactor
- [ ] 4.4 Run full project verification: `npm run lint`, `tsc`, `npm test`, and `npm run build`
