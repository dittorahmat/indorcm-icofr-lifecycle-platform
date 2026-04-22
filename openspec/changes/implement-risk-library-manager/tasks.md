## 1. Shared Models & Database

- [x] 1.1 Update `shared/types.ts` with `RiskLibrary` interface and verify `BUMNCluster` enum.
- [x] 1.2 Add `riskLibrary` table definition to `worker/db/schema.ts`.
- [x] 1.3 Generate Drizzle migration using `bun drizzle-kit generate`.
- [x] 1.4 Apply migration to the local database using `bun drizzle-kit up`.

## 2. Backend Implementation

- [x] 2.1 Implement `GET /api/risklibrary` with cluster filtering in `worker/user-routes.ts`.
- [x] 2.2 Implement `POST /api/risklibrary` for creating new standardized risks in `worker/user-routes.ts`.
- [x] 2.3 Implement `PUT /api/risklibrary/:id` for updating existing risks in `worker/user-routes.ts`.
- [x] 2.4 Implement `DELETE /api/risklibrary/:id` for removing risks from the library in `worker/user-routes.ts`.

## 3. Frontend UI - Management

- [x] 3.1 Create `src/pages/rcm/RiskLibraryPage.tsx` featuring a data table with search and cluster filtering.
- [x] 3.2 Implement "Add/Edit Risk" functionality using a `Sheet` component in `RiskLibraryPage.tsx`.
- [x] 3.3 Register the new `/rcm/risk-library` route in `src/main.tsx`.
- [x] 3.4 Integrate the "Risk Library" menu item into the RCSA group in `src/components/app-sidebar.tsx`.

## 4. Frontend UI - Integration

- [x] 4.1 Refactor `src/components/rcm/RiskLibraryLookup.tsx` to ensure proper integration with React Hook Form.
- [x] 4.2 Integrate the `RiskLibraryLookup` trigger into the risk description section of `src/components/rcm/ControlEditor.tsx`.

## 5. Localization & Final Verification

- [x] 5.1 Add all new UI strings to the Indonesian locale in `src/i18n/locales/id.json`.
- [x] 5.2 Add all new UI strings to the English locale in `src/i18n/locales/en.json`.
- [x] 5.3 Verify the end-to-end flow: creating a standardized risk, finding it in the library, and selecting it within the Control Editor.
