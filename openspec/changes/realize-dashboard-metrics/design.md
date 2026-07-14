## Context

Currently, the main dashboard displays static mock placeholders for several key compliance indicators:
- `csaCompletion` is hardcoded to `88.5%` inside `Dashboard.tsx`.
- `remediationAvgDays` is hardcoded to `"12 Days Avg."` via the translation files.
- `line2Percent` is hardcoded to `"94.2% Verified"` via the translation files.

This design document outlines the strategy to calculate these metrics dynamically in the frontend using real data fetched from the API, filtered and calculated in memory based on the selected Fiscal Year (`workingYear`).

## Goals / Non-Goals

**Goals:**
- Replace hardcoded compliance metrics with dynamically calculated values.
- Recalculate metrics reactively when the user switches the active fiscal year (`workingYear`).
- Integrate translation localization parameter interpolation (i.e. `{{days}}` and `{{percent}}`) to preserve translation integrity.
- Compute metrics using existing `/api/controls`, `/api/deficiencies`, and `/api/actionplans` data endpoints.

**Non-Goals:**
- Creating new backend API endpoints or altering database schemas.
- Changing calculations for other parts of the compliance flow (such as RCM scoping or materiality rules).

## Decisions

### 1. Client-Side In-Memory Calculations
Instead of writing new SQL aggregation queries on the backend worker, we will compute the metrics directly in the React frontend within `Dashboard.tsx` using `useMemo`.
- **Why**: The dataset size (controls, deficiencies, and action plans) per organization is small enough to perform instant in-memory operations. Doing this on the client avoids adding database/API overhead and makes the metrics responsive to year changes instantly.

### 2. Metric Computation Logic
- **CSA Completion Rate**:
  - **Logic**: Percentage of controls that have completed their assessment relative to total controls.
  - **Formula**: `(Controls with lastCsaDate !== null OR line2Validation.status IN ('Validated', 'Pending')) / (Total Controls for year) * 100`
- **Line 2 Validation Rate**:
  - **Logic**: Percentage of completed assessments that have been verified by Line 2.
  - **Formula**: `(Controls with line2Validation.status === 'Validated') / (Completed Controls) * 100` (or `0` if no completed controls exist).
- **Remediation Velocity (Average Days)**:
  - **Logic**: The average duration in days between deficiency identification and its action plan completion.
  - **Formula**: For each resolved deficiency (`status` is `'Remediated'`, `'Verified'`, or `'Closed'`), calculate the difference in days between `actionPlan.actualCompletionDate` and `deficiency.identifiedDate`. Average these values.
  - If no resolved deficiencies exist, fallback to displaying a placeholder like `"0"` or `"N/A"`.

### 3. Localization Structure Update
Update English and Indonesian translation files to accept parameter variables:
- English:
  - `"remediationAvgDays": "{{days}} Days Avg."`
  - `"line2Percent": "{{percent}}% Verified"`
- Indonesian:
  - `"remediationAvgDays": "Rata-rata {{days}} Hari"`
  - `"line2Percent": "{{percent}}% Terverifikasi"`

## Risks / Trade-offs

- **[Risk] Division by Zero** → If a new fiscal year has zero controls, computing completion rate or Line 2 validation will return `NaN`.
  - *Mitigation*: Implement safeguards (`total > 0 ? value : 0`) in all calculations.
- **[Risk] Missing Date Data** → Old deficiencies or action plans might have null values for `identifiedDate` or `actualCompletionDate`.
  - *Mitigation*: Exclude records with missing date information from the average calculation.
