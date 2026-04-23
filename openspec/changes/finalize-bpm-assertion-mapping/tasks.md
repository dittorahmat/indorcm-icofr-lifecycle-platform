## 1. Database & Types Setup

- [x] 1.1 Update `shared/types.ts` to include the `AccountAssertion` interface.
- [x] 1.2 Add the `accountAssertions` table definition to `worker/db/schema.ts`.
- [x] 1.3 Generate Drizzle migration using `npx drizzle-kit generate`.
- [x] 1.4 Apply migration to the database using `npx drizzle-kit push` or running the generated SQL.

## 2. Backend Implementation (Worker)

- [x] 2.1 Implement `GET /api/account-assertions` in `worker/user-routes.ts`.
- [x] 2.2 Implement `POST /api/account-assertions` (upsert logic) in `worker/user-routes.ts`.
- [x] 2.3 Update `GET /api/rcm-matrix/tlc` to left-join with `accountAssertions` and implement fallback logic for assertions.

## 3. Frontend Implementation (BPM Page)

- [x] 3.1 Implement the Financial Assertion Table in `src/pages/bpm/BPMPage.tsx`.
- [x] 3.2 Add `Tooltip` components with SK-5 Table 8 descriptions to table headers.
- [x] 3.3 Integrate `useQuery` to fetch and `useMutation` to save account assertions.
- [x] 3.4 Add localization keys to `src/i18n/` for both ID and EN languages.
- [x] 3.5 Implement `useBlocker` or `useUnsavedChanges` to protect against navigation data loss in `BPMPage.tsx`.

## 4. Finalization & Testing

- [x] 4.1 Verify that assertions set in BPM flow correctly to the RCM TLC Page.
- [x] 4.2 Verify that manual overrides in RCM TLC Page work as expected.
- [x] 4.3 Verify that the unsaved changes dialog appears when navigating away with dirty state.
- [x] 4.4 Run a full lint and type check.
