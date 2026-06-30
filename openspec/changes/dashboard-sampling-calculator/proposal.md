## Why

Currently, the IndoGRC Pro dashboard lacks a high-level executive summary showing the progress and realization of Control Self-Assessment (CSA) or TOE testing across the organization. Auditors and compliance officers (Lini 2 & Lini 3) cannot easily see if the controls registered in the database are being actively tested and whether those tests comply with the sampling benchmarks defined in BUMN SK-5/DKU.MBU/11/2024 Table 22.

## What Changes

- Add a new "Control Testing & CSA Realization Summary" table widget in the dashboard page (located in the empty sidebar space below the "Compliance Engine" dashed banner on the right side).
- The table widget will dynamically load all controls from the database and group them by **Control Frequency** (Annual, Quarterly, Monthly, Weekly, Daily, Ad-hoc, Automated).
- For each frequency category, the table will display:
  - **Frequency Category**: Grouped frequency name (localized).
  - **Control Count (Population)**: Total count of active controls in the database with this frequency.
  - **Regulatory Sample Target**: The BUMN SK-5 Table 22 sample range (e.g., "2 - 5" for Monthly, "15 - 40" for Daily) as a reference guideline.
  - **CSA Realization**: Number of controls in this group that have completed CSA submissions or tests.
  - **Status/Progress**: A visual indicator or percentage bar showing testing realization.

## Capabilities

### New Capabilities
- `regulatory-sampling-calculator`: Summary table widget on the dashboard showing the active control population, mandated Table 22 sample targets, and real-time CSA/testing realization progress grouped by frequency.

### Modified Capabilities
<!-- None -->

## Impact

- **UI Components**:
  - `src/pages/Dashboard.tsx` to integrate the realization summary table widget.
  - A new component `src/components/dashboard/CSARealizationTable.tsx` to fetch, group, and render the controls.
- **Utilities**:
  - Utilizes existing helper logic in `src/lib/compliance-utils.ts` to fetch the static Table 22 ranges for each frequency group.
- **i18n**:
  - Adding English and Indonesian translations for realization metrics, column headers, and statuses.
