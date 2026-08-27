## 1. Schema & Backend API Extensions

- [x] 1.1 Add `application_documents` table to `worker/db/schema.ts` and export types in `shared/types.ts`
- [x] 1.2 Implement API endpoints in `worker/routes/infrastructure.ts` for listing, uploading, and deleting application evidence documents per ITGC domain
- [x] 1.3 Add backend endpoint / query helper to fetch TLC and ITGC controls filtered by `applicationId`

## 2. BPM & Control Editor Significant Applications Field

- [x] 2.1 Add the Significant Applications combobox between `controlNature` and `frequency` in `src/components/rcm/properties/RegulatoryPropertySheet.tsx`
- [x] 2.2 Implement inline application creation capability within the combobox
- [x] 2.3 Update `src/components/rcm/ControlEditorGeneralSection.tsx` and related dialogs to support the field seamlessly
- [x] 2.4 Verify that control creation and deletion maintain application integrity without cascading deletions

## 3. Application Detail Dialog & ITGC Evidence Repositories

- [x] 3.1 Create `src/components/rcm/ApplicationDetailDialog.tsx` with a 6-tab layout
- [x] 3.2 Implement Tab 1 (RCM TLC) and Tab 2 (RCM ITGC) data tables showing filtered controls for the selected application with jump-to-source action
- [x] 3.3 Implement Tab 3 to Tab 6 (Access to Program & Data, Program Changes, Program Development, Computer Operations) document evidence repositories
- [x] 3.4 Implement file upload component with progress, validation, uploader logging (user & timestamp), and file download
- [x] 3.5 Implement in-app file preview modal for PDF and image formats

## 4. UI Integration & Page Revamp

- [x] 4.1 Update `/applications` table in `src/pages/rcm/SOCMonitoringPage.tsx` so clicking any application row triggers the 6-tab detail dialog
- [x] 4.2 Add complete localization keys in English (`src/i18n/locales/en/rcm.json`) and Indonesian (`src/i18n/locales/id/rcm.json`)

## 5. Testing & Verification

- [x] 5.1 Add unit/integration tests for application document endpoints and control linkage
- [x] 5.2 Execute type check (`npm run type-check`), linting (`npm run lint`), build (`npm run build`), and test suite (`npm test`)
