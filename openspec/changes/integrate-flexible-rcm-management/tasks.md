## 1. Database & Backend Setup

- [ ] 1.1 Add `isFraudRelated` and `riskRating` columns to `rcms` table in `worker/db/schema.ts`
- [ ] 1.2 Add `description` and ensure `isKeyControl` columns in `controls` table in `worker/db/schema.ts`
- [ ] 1.3 Generate and run Drizzle migrations (`bun db:generate` & `bun db:migrate`)
- [ ] 1.4 Update `rcm` and `control` interface definitions in `shared/types.ts`
- [ ] 1.5 Update `POST /api/rcm` and `POST /api/controls` routes in `worker/user-routes.ts` to accept new metadata fields

## 2. Localization & Cleanup

- [ ] 2.1 Add translation strings for "Fraud Indicator", "Risk Rating", "Key Control", "Low/Medium/High" in `src/i18n/locales/en.json`
- [ ] 2.2 Add translation strings for "Indikator Fraud", "Rating Risiko", "Pengendalian Utama", "Rendah/Sedang/Tinggi" in `src/i18n/locales/id.json`
- [ ] 2.3 Delete `src/pages/rcm/RiskLibraryPage.tsx`
- [ ] 2.4 Delete `src/components/rcm/RiskLibraryLookup.tsx`
- [ ] 2.5 Remove "Risk Library" menu item from `src/components/app-sidebar.tsx`

## 3. BPM Editor UI Refactor

- [ ] 3.1 Implement "Search-or-Create" Combobox component for Risks in `BPMEditor.tsx`
- [ ] 3.2 Implement "Search-or-Create" Combobox component for Controls in `BPMEditor.tsx`
- [ ] 3.3 Create mini-form for New Risk metadata (Fraud, Rating) in sidebar
- [ ] 3.4 Create mini-form for New Control metadata (Description, Key Control) in sidebar
- [ ] 3.5 Update `linkRiskToActivity` and `linkControlToRisk` logic to handle direct creation and metadata

## 4. Verification

- [ ] 4.1 Verify database schema update in D1/Postgres
- [ ] 4.2 Verify Risk creation with Fraud/Rating metadata from BPM side panel
- [ ] 4.3 Verify Control creation with Key Control metadata from BPM side panel
- [ ] 4.4 Verify search functionality returns existing risks/controls correctly
