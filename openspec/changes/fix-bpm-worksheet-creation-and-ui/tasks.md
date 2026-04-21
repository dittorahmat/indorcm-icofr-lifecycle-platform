## 1. Backend API Fixes

- [x] 1.1 Update `POST /api/controls` role check to allow `Line 1`.
- [x] 1.2 Update `POST /api/controls` database insertion to include `bpmProcessId` and conditional `bpmStatus` (Draft for Staff).
- [x] 1.3 Implement `POST /api/controls/:id/submit-for-approval` endpoint.
- [x] 1.4 Implement `POST /api/controls/:id/reject` endpoint.

## 2. Frontend UI Corrections

- [x] 2.1 Update `BPMWorksheet.tsx` to use `useTranslation('bpm')`.
- [x] 2.2 Enhance `BPMWorksheet.tsx` header to display `fsliName` and `noGL`.
- [x] 2.3 Update button label in `BPMWorksheet.tsx` to ensure it uses the correct key.

## 3. Localization and Terminology

- [x] 3.1 Update `src/i18n/locales/en/bpm.json`: Rename `worksheet.addRow` to "Add Row In Worksheet".
- [x] 3.2 Update `src/i18n/locales/id/bpm.json`: Rename `worksheet.addRow` to "Tambah Baris di Worksheet".

## 4. Verification

- [x] 4.1 Verify Admin can add row and it appears immediately in the table.
- [x] 4.2 Verify Line 1 Staff can add row and status is "Draft".
- [x] 4.3 Verify translation keys are resolved and header shows account details.
