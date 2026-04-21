## Context

The frontend implementation of the Remediation module follows Regulation SK-5/2024, but the backend is using a legacy schema. The `shared/types.ts` file already contains the rich interfaces required for regulatory compliance, but `worker/db/schema.ts` lacks these fields. Additionally, the `worker/user-routes.ts` file only has `GET` handlers for deficiencies and action plans, meaning any updates made in the UI are lost.

## Goals / Non-Goals

**Goals:**
- Align `worker/db/schema.ts` with the rich interfaces in `shared/types.ts`.
- Implement robust `POST` and `PUT` handlers in `worker/user-routes.ts` for both deficiencies and action plans.
- Automate status synchronization between Action Plans and Deficiencies (e.g., an Action Plan marked "Resolved" should move its Deficiency to "Remediated").
- Ensure all mutations are captured in the `audit_logs` table for regulatory compliance (Lampiran 6).

**Non-Goals:**
- Modifying the existing UI components (`DeficiencyBoard.tsx`, `RemediationForm.tsx`).
- Implementing bulk upload/import for remediation plans.

## Decisions

### 1. Database Schema Alignment
We will update `worker/db/schema.ts` to include all missing fields defined in `shared/types.ts`.

**Table: `deficiencies`**
- Add: `identifiedDate` (timestamp), `identifiedBy` (text), `rootCause` (text), `magnitude` (doublePrecision), `likelihood` (text).
- Note: These fields support the Degree of Deficiency (DoD) assessment logic already present in the UI.

**Table: `action_plans`**
- Add: `relatedFunction` (text), `picName` (text), `planDescription` (text), `activityDetail` (text), `remediatedControlDescription` (text), `targetDate` (timestamp), `actualCompletionDate` (timestamp), `isApprovedByLine2` (boolean), `isBeforeYearEnd` (boolean).
- Note: These support the formal Remediation Plan documentation (Lampiran 6 & 11).

### 2. API Endpoint Implementation
We will add the following endpoints to `worker/user-routes.ts`:
- `POST /api/actionplans`: For creating new remediation plans manually or via auto-logic.
- `PUT /api/actionplans/:id`: For updating plan details and handling status transitions (Draft -> Review -> In Progress).
- `PUT /api/deficiencies/:id`: For updating deficiency severity (CD, SD, MW) and status.

### 3. Business Logic: Status Synchronization
To ensure consistency, the backend will implement state-aware logic:
- If `ActionPlan.status` updates to `Resolved`, `Deficiency.status` automatically updates to `Remediated`.
- If `ActionPlan.status` updates to `Verified`, `Deficiency.status` automatically updates to `Verified`.

### 4. Regulatory Audit Logging
Every `POST` or `PUT` call to these entities will trigger an entry in `audit_logs` with `isRegulatory: true`, capturing the user, timestamp, and changes (dataBefore/dataAfter).

### 5. Multi-language Support (i18n)
Create a new i18n namespace `remediation.json` in `src/i18n/locales/{en,id}/` to house translations for:
- Form labels (Related Function, PIC, etc.)
- Status labels in the Kanban board.
- Validation messages for regulatory fields.
Update `src/i18n/config.ts` to include the new namespace.

## Risks / Trade-offs

- **[Risk] Data Type Inconsistency** → Mitigation: Use Zod validation in the worker handlers to ensure incoming JSON matches the expected DB schema and shared types.
- **[Risk] Migration Failure on Production** → Mitigation: Use Drizzle's `column.default()` or nullability for new fields to ensure existing records don't break the migration.
