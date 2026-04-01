## Why

The current Scoping module incorrectly identifies all accounts as "Significant" due to hardcoded UI labels and a lack of automated filtering during data import. This misleads users and fails to comply with Regulation SK-5/2024, which requires a clear distinction between Significant and Insignificant accounts based on Quantitative (Performance Materiality) and Qualitative factors.

## What Changes

- **Dynamic UI Badges**: Replace the hardcoded "Significant" badge in `ScopingPage.tsx` with dynamic logic that checks if an account is truly significant.
- **Improved Import Filtering**: Update the GL upload handler to automatically filter out accounts below the Performance Materiality (PM) threshold unless they are flagged for qualitative reasons.
- **Enhanced Reason Column**: Update the "Reason" display to show specific qualitative reasons (e.g., "Fraud Risk") or simply "> PM" for quantitative significance.
- **Status Toggle**: (Optional) Allow users to manually toggle an account's significance status in the matrix.

## Capabilities

### New Capabilities
- `significant-account-filtering`: Automated logic to distinguish between significant and non-significant accounts based on SK-5 criteria.

### Modified Capabilities
- None.

## Impact

- **Components**: `ScopingPage.tsx` (UI and logic updates).
- **Data Model**: No changes to `shared/types.ts`, but existing mock data in `mock-data.ts` will be better utilized.
