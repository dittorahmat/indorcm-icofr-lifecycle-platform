## Context

The current `DoDWizard.tsx` component handles the flowchart-based assessment of deficiency severity. However, it operates in isolation from the Scoping/Materiality data and ignores "hard" indicators of Material Weakness defined in SK-5/2024. The data model for `Deficiency` also needs expansion to accommodate the structured requirements of Lampiran 10 (assertions, quantitative exposure).

## Goals / Non-Goals

**Goals:**
- Implement "Step 0" for automatic MW indicators.
- Integrate active Scoping `allocatedPM` into the wizard logic.
- Expand the `Deficiency` type and component state to capture Lampiran 10 fields.
- Ensure the final rationale includes the calculated magnitude comparison.

**Non-Goals:**
- Modifying the backend API for scoping (assume existing endpoints work).
- Changing the RCM structure.
- Implementing the full Lampiran 11 (Management Assessment) report.

## Decisions

- **Decision 1: Wizard State Management**
  - **Option A**: Use a single large state object for all answers.
  - **Option B**: Split into `preAssessment` (Step 0) and `flowchartAnswers` (Steps 1-7).
  - **Rationale**: Choosing **Option B** to clearly separate the "Automatic MW" logic from the flowchart logic, making it easier to skip steps if a MW indicator is hit.

- **Decision 2: Linking Scoping Data**
  - **Option A**: Pass PM value as a prop to `DoDWizard`.
  - **Option B**: Fetch PM inside `DoDWizard` using a hook.
  - **Rationale**: Choosing **Option A**. The parent page (`DeficiencyBoard.tsx`) already handles API data. Passing it down ensures the wizard remains a "pure" UI component for assessment.

- **Decision 3: Assertion Data Format**
  - **Option A**: Store as a comma-separated string.
  - **Option B**: Store as an array of assertion keys in the `Deficiency` type.
  - **Rationale**: Choosing **Option B** for better type safety and compatibility with the `shared/types.ts` `ControlAssertion` type.

## Risks / Trade-offs

- **Risk**: Scoping simulation might be missing (Draft/Rejected state).
  - **Mitigation**: Add a fallback to "Manual Entry" for PM if no active scoping simulation is found.
- **Risk**: Overloading the Wizard UI with too many questions.
  - **Mitigation**: Use a Step-based progress indicator and only show "Box 3" exposure fields when the user is on that specific step.
