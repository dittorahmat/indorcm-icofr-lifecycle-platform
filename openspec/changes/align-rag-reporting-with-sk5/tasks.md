## 1. Database & Schema Updates

- [x] 1.1 Add `test_samples` table to Drizzle schema to support row-level attributes (Lampiran 7)
- [x] 1.2 Add `tod_pilar_evaluations` columns to `test_records` or separate table (Lampiran 8)
- [x] 1.3 Implement `notifications` table for compliance alerts
- [x] 1.4 Run `npx drizzle-kit push` and verify DB integrity
- [x] 1.5 Update TypeScript types in `shared/types.ts` to match new schema

## 2. Core UI Components

- [x] 2.1 Create `RegulatorySamplingTable` reusable component with Pass/Fail toggles
- [x] 2.2 Create `TODSixPillarForm` component with mandated SK-5 evaluation fields
- [x] 2.3 Implement `NotificationBell` in `AppHeader` with unread counts
- [x] 2.4 Create `NotificationDropdown` to display compliance alerts
- [x] 2.5 Refactor `ControlTestCard.tsx` to use newly extracted components (SRP)

## 3. Business Logic & Guardrails

- [x] 3.1 Implement Zero Tolerance calculation logic for TOE/CSA results
- [x] 3.2 Integrate `UnsavedChangesGuard` into the sampling grid and TOD form
- [x] 3.3 Add backend validation for required regulatory pillars in TOD submission
- [x] 3.4 Implement auto-generation of "Summary Samples" for existing legacy test records

## 4. Localization & Refinement

- [x] 4.1 Update `src/i18n/id.json` and `en.json` with all new regulatory labels
- [x] 4.2 Audit `TestWorkbench.tsx` for code smells (DRY, Clean Code) and apply fixes
- [x] 4.3 Verify all API endpoints handle the new sample payload correctly
- [x] 4.4 Add notification triggers for CSA period and remediation deadlines

## 5. Validation

- [x] 5.1 Run `npm run type-check` and fix any regressions
- [x] 5.2 Execute `npm test` to ensure existing flows are unbroken
- [x] 5.3 Perform `npm run build` to verify production readiness
- [x] 5.4 Manual walkthrough of TOD/TOE flows to verify SK-5 alignment

