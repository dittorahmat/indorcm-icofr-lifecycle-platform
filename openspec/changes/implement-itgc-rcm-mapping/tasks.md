## 1. Database & Types

- [x] 1.1 Update `shared/types.ts` to include ITGC specific types and fields (`itgcDomain`, `supportingApp`, `automatedControlType`).
- [x] 1.2 Update `worker/db/schema.ts` to add new columns to `regulatoryPairs` table.
- [x] 1.3 Generate and run drizzle migration to sync database schema.

## 2. Form Enhancement (Property Sheet)

- [x] 2.1 Update `src/components/rcm/properties/ITGCForm.tsx` to include "Aplikasi Pendukung" and "Jenis Pengendalian Otomatis" fields.
- [x] 2.2 Implement conditional rendering for ITGC metadata based on control nature (Automated/ITDM/MRC).
- [x] 2.3 Add descriptive tooltips for each Domain ITGC based on SK-5/2024 definitions.
- [x] 2.4 Ensure change tracking for new ITGC fields triggers the unsaved changes warning.

## 3. Localization & Strings

- [x] 3.1 Update `src/i18n/id/rcm.json` with Indonesian regulatory terminology for ITGC.
- [x] 3.2 Add help text strings for ITGC control types.

## 4. RCM ITGC Matriks Implementation

- [x] 4.1 Create `src/pages/rcm/RCMITGCPage.tsx` based on the existing TLC page structure.
- [x] 4.2 Configure table columns to match Lampiran 5.c (hiding assertions/IPO, showing TI metadata).
- [x] 4.3 Implement filtering logic to only display pairs with classification 'ITGC'.
- [x] 4.4 Integrate the new ITGC page into the main RCM navigation/tabs.
