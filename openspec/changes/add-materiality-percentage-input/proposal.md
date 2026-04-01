## Why

According to **SK-5/2024 (page 27)**, determining the Overall Materiality (OM) percentage requires professional judgment (e.g., 5% for profit-based benchmarks vs 1% for asset-based benchmarks). Currently, the UI lacks an explicit input field for this percentage, making it difficult for users to adjust the calculation according to their chosen benchmark basis.

## What Changes

- **Add OM Percentage Input**: Add a new numerical input field labeled "% OM (Overall Materiality)" in the Materiality Calculation form.
- **Link to Calculation Logic**: Ensure the existing calculation logic uses the value from this input field.
- **Validation**: Ensure the input is a valid percentage (0-100%).

## Capabilities

### New Capabilities
- `materiality-percentage-control`: Explicit control over the percentage used for Overall Materiality calculation.

### Modified Capabilities
- None

## Impact

- `src/pages/scoping/ScopingPage.tsx`: Addition of the input field in the React Hook Form.
