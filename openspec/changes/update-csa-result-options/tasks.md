## 1. Data Model & Schema Updates

- [x] 1.1 Update `CSARecord` interface in `shared/types.ts` to use `"High" | "Medium" | "Low"` for `result`.
- [x] 1.2 Update `csaSchema` in `src/pages/csa/CSAWorkspace.tsx` to use the new enum.

## 2. UI Implementation

- [x] 2.1 Modify the `RadioGroup` in `ControlAssessmentCard` to show "High", "Medium", and "Low" options.
- [x] 2.2 Apply visual styling (background colors) to the radio button items based on their value.
- [x] 2.3 Ensure existing assessments (if any) display correctly with the new labels.

## 3. Logic & Integration

- [x] 3.1 Update the `mutation.onSuccess` handler in `ControlAssessmentCard` to trigger deficiency invalidation if result is "High" or "Medium".
- [x] 3.2 Verify that the "Add Deficiency" logic correctly interprets the new rating values.
