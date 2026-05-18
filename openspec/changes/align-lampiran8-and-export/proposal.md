## Why

The current `VerificationDesignPage.tsx` does not fully align with the required columns specified in SK-5/DKU.MBU/11/2024 Lampiran 8 (Ilustrasi Verifikasi Rancangan Pengendalian). It is missing several critical data points required for regulatory compliance. Additionally, the user requested a feature to print or export this matrix to PDF for reporting and documentation purposes.

## What Changes

- Update `VerificationDesignPage.tsx` to include missing columns from Lampiran 8: `Aplikasi Pendukung`, `Fungsi Pelaksana`, `Pelaku Pengendalian`, `Item LK terdampak`, and `Periode Efektif`.
- Ensure the data fetching logic in `worker/routes/rcm.ts` provides these missing fields to the frontend.
- Implement a Print PDF feature on the `VerificationDesignPage.tsx` using a print-specific CSS approach to format the table cleanly for physical or PDF output.

## Capabilities

### New Capabilities
- `lampiran-8-pdf-export`: Capability to export the Lampiran 8 verification design matrix to a printable PDF format.

### Modified Capabilities
- `lampiran-8-alignment`: Modifying the existing Verification Design view to align perfectly with the SK-5 Lampiran 8 column requirements.

## Impact

- **Frontend Components:** `VerificationDesignPage.tsx` will have new columns and a working print button. Print-specific CSS will be added.
- **API:** `worker/routes/rcm.ts` (`/rcm-matrix/verification-design` endpoint) needs to ensure the new fields are selected and returned.
- **Database:** None, assuming the fields already exist in `rcmControls` (they appear to be mapped).