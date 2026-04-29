## 1. Database & Schema

- [x] 1.1 Create Drizzle migration to add `status` and `lastAssessmentDate` to `controls` table
- [x] 1.2 Run `npx drizzle-kit generate` and `npx drizzle-kit migrate` (or equivalent)
- [x] 1.3 Update `shared/types.ts` to include new fields in `Control` interface

## 2. Refactor CSA Core Component

- [x] 2.1 Refactor `CSATabContent.tsx` to handle standalone data fetching if `controls` prop is missing
- [x] 2.2 Add `controlId` selection logic to `CSATabContent` for global listing context
- [x] 2.3 Integrate `useUnsavedChanges` hook into the CSA assessment form
- [x] 2.4 Update localization strings for CSA in `src/i18n/` (en/id)

## 3. Implementation of Standalone Components & Pages

- [x] 3.1 Create `src/components/bpm/CSAModal.tsx` as a standalone wrapper for `CSATabContent`
- [x] 3.2 Create `src/pages/csa/CSAPage.tsx` for the full-page assessment experience
- [x] 3.3 Register `/csa` route in `src/main.tsx`
- [x] 3.4 Add "Control Self Assessment" menu item to `src/components/app-sidebar.tsx`

## 4. UI Refactor & Integration

- [x] 4.1 Update `BPMPage.tsx` to trigger `CSAModal` on sub-process name click
- [x] 4.2 Update `BPMPage.tsx` table to ensure `BPMModal` (Worksheet) is accessible via Action icon
- [x] 4.3 Add tooltips and visual cues to `BPMPage` for the new navigation flow
- [ ] 4.4 Verify breadcrumbs and layout consistency in `CSAPage`

## 5. Validation & Testing

- [ ] 5.1 Verify CSA Modal opens correctly with pre-filtered controls from BPM Page
- [ ] 5.2 Verify CSA Page displays global listing of controls correctly
- [ ] 5.3 Test Unsaved Changes warning on both Modal and Page
- [ ] 5.4 Verify database updates after successful assessment sign-off
