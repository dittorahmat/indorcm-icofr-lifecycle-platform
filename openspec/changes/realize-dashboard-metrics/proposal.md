## Why

Currently, the main dashboard contains several hardcoded compliance metrics: the Control Self-Assessment (CSA) completion rate is fixed at 88.5%, and the remediation velocity and Line 2 validation metrics are hardcoded translations rather than being derived from real database/store values. To provide management and auditors with an accurate representation of the ICOFR lifecycle compliance status in real-time, these metrics must be dynamically calculated and displayed based on actual data associated with the active Fiscal Year.

## What Changes

- **Real-time CSA Completion Rate**: Replace the hardcoded `88.5%` value with a dynamic calculation. The rate will be calculated based on the total number of controls and the number of controls that have completed their assessment for the selected fiscal year.
- **Dynamic Remediation Velocity**: Calculate the average number of days taken to resolve or remediate open deficiencies based on actual deficiency data for the active fiscal year, instead of displaying static localized text.
- **Dynamic Line 2 Validation Rate**: Calculate the percentage of control self-assessments that have been validated by Line 2 (Lini 2) for the active fiscal year.
- **Dashboard UI Integration**: Update the frontend layout and components to dynamically receive, compute, and render these metrics, showing appropriate loading/fallback states when fetching the data.

## Capabilities

### New Capabilities
- `dashboard-analytics`: Dynamic computation and visualization of aggregate ICOFR compliance metrics (CSA Completion, Remediation Velocity, and Line 2 Validation) filtered by active fiscal year.

### Modified Capabilities
- `csa-management`: Expose or calculate real-time completion status and Line 2 validation status for controls.
- `remediation-tracking`: Expose or calculate remediation velocity/average completion times for deficiencies.

## Impact

- **Frontend Pages/Components**:
  - `src/pages/Dashboard.tsx`: Integrate queries and calculate the metrics dynamically.
  - `src/components/dashboard/ActionCenter.tsx`: Update to receive dynamic `csaCompletion` rate.
- **Backend API Endpoints**:
  - Expose deficiency resolution times or ensure existing `/api/deficiencies` and `/api/controls` queries return sufficient historical/status data to compute the required metrics, or introduce dashboard summary analytics endpoints if needed.
