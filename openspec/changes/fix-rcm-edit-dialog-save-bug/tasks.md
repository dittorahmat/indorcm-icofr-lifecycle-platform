## 1. Dialog Identity & Schema Fixes

- [x] 1.1 Add `id` field to `formSchema` in `src/components/rcm/RCMEditDialog.tsx` to preserve record identity.
- [x] 1.2 Update `React.useEffect` reset logic in `RCMEditDialog.tsx` to include `id` from the incoming data.

## 2. ELC Page Restoration

- [x] 2.1 Update `saveMutation` in `src/pages/rcm/RCMELCPage.tsx` to use `PUT` method instead of `PATCH`.
- [x] 2.2 Implement payload transformation in `RCMELCPage.tsx` to map `mappedControlName` -> `name` and `mappedControlDescription` -> `description`.
- [x] 2.3 Verify that `mappingId` is correctly passed as the `id` parameter in the API URL.

## 3. Backend Integrated Batch-Update

- [x] 3.1 Modify `rcm.post('/rcm-matrix/:type/batch-update', ...)` in `worker/routes/rcm.ts` to detect `riskDescription` or `riskRating` fields.
- [x] 3.2 Add update logic for the `rcms` table based on the `rcmId` (can be fetched from `rcmControls` if not provided in payload).
- [x] 3.3 Ensure the batch operation handles both `rcmControls` and `rcms` updates atomically or sequentially.

## 4. TLC & ITGC Page Restoration

- [x] 4.1 Implement payload transformation in `src/pages/rcm/RCMTLCPage.tsx` to map `mappedControlName` -> `controlName` and `mappedControlDescription` -> `controlDescription`.
- [x] 4.2 Add boolean-to-string conversion for IPO and Assertion fields in `RCMTLCPage.tsx` before mutation.
- [x] 4.3 Apply identical transformation and conversion logic to `src/pages/rcm/RCMITGCPage.tsx`.

## 5. Verification & Testing

- [x] 5.1 Verify data save functionality on the ELC page (Control Name/Desc).
- [x] 5.2 Verify data save functionality on the TLC page (Risk Desc, Control Name, IPO, Asersi).
- [x] 5.3 Verify data save functionality on the ITGC page (Domain, Control Name, Metadata).
- [x] 5.4 Run `npm run type-check` to ensure no regressions in shared types.
