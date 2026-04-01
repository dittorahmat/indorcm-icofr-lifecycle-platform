## 1. UI Implementation

- [x] 1.1 Add the `% OM (Overall Materiality)` input field to the form in `src/pages/scoping/ScopingPage.tsx`.
- [x] 1.2 Include an `Info` tooltip or descriptive label referencing SK-5/2024 Table 3.

## 2. Logic Integration

- [x] 2.1 Verify that the `percentage` field correctly updates the `baseOM` calculation in real-time.
- [x] 2.2 Ensure the default value of 5 is preserved if no input is provided.

## 3. Verification

- [x] 3.1 Verify that entering 1% for an asset-based benchmark results in the correct OM value.
- [x] 3.2 Verify that values outside the 0-100 range trigger validation errors.
