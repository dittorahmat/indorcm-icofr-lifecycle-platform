## ADDED Requirements

### Requirement: Consistent Deficiency Status Filtering
The system SHALL ensure that all dashboard visualizations related to deficiencies use consistent status filtering logic. Specifically, charts displaying "Open Deficiencies" MUST only count records where the status is "Open".

#### Scenario: Pie chart matches KPI card
- **WHEN** the user views the Dashboard
- **THEN** the total count in the "Deficiencies by Severity" pie chart MUST equal the count shown in the "Open Deficiencies" KPI card.

### Requirement: Accurate Control-to-Process Mapping
The system SHALL correctly map controls to their respective business processes in dashboard visualizations. This mapping MUST NOT rely on potentially unpopulated nested properties but should use direct lookups or grouping from available control data.

#### Scenario: Bar chart shows correct counts
- **WHEN** the user views the "Controls by Process" bar chart
- **THEN** the bars MUST reflect the actual number of controls associated with each business process, even if the RCM data does not have nested control arrays.

### Requirement: Precise Metric Labeling
The system SHALL provide precise labels for all dashboard metrics to clarify what is being measured (e.g., distinguishing between "Open Deficiencies" and "Total Deficiencies").

#### Scenario: KPI card label update
- **WHEN** the user views the Dashboard KPI cards
- **THEN** labels MUST clearly indicate the scope of the metric, such as using "Open Deficiencies" instead of just "Deficiencies" if filtering is applied.
