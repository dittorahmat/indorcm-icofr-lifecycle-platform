## 1. Database Schema Update

- [x] 1.1 Update `deficiencies` table in `worker/db/schema.ts` with regulatory fields (identifiedDate, identifiedBy, rootCause, magnitude, likelihood).
- [x] 1.2 Update `action_plans` table in `worker/db/schema.ts` with regulatory fields (relatedFunction, picName, planDescription, activityDetail, remediatedControlDescription, targetDate, actualCompletionDate, isApprovedByLine2, isBeforeYearEnd).
- [x] 1.3 Generate and run Drizzle migrations to apply the schema changes.

## 2. API Implementation

- [x] 2.1 Implement `POST /api/actionplans` handler in `worker/user-routes.ts` with audit logging support.
- [x] 2.2 Implement `PUT /api/actionplans/:id` handler in `worker/user-routes.ts` with status transition logic and audit logging.
- [x] 2.3 Implement `PUT /api/deficiencies/:id` handler in `worker/user-routes.ts` with support for updating severity and status.

## 3. Business Logic Integration

- [x] 3.1 Implement backend status synchronization (Action Plan "Resolved/Verified" updates parent Deficiency status).
- [x] 3.2 Implement backend `isBeforeYearEnd` calculation logic based on completion date and organization fiscal year.
- [x] 3.3 Ensure all mutation endpoints create an `audit_logs` record with `isRegulatory: true`.

## 4. Verification

- [x] 4.1 Verify data persistence from `RemediationForm.tsx` to the database through the new API.
- [x] 4.2 Verify Kanban board drag-and-drop triggers correct status updates in the backend.
- [x] 4.3 Verify Degree of Deficiency (DoD) assessment data is correctly persisted in the `deficiencies` table.
- [x] 4.4 Verify audit logs show full "Before" and "After" snapshots for remediation changes.

## 5. Localization (i18n)

- [x] 5.1 Create `src/i18n/locales/en/deficiency.json` with English translations for all remediation fields and statuses.
- [x] 5.2 Create `src/i18n/locales/id/deficiency.json` with Indonesian translations.
- [x] 5.3 Register the `deficiency` namespace in `src/i18n/config.ts`.
- [x] 5.4 Update `DeficiencyBoard.tsx` and `RemediationForm.tsx` to use the `useTranslation` hook with the `deficiency` namespace.
