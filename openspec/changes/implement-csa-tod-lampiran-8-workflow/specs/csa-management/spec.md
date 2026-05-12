## MODIFIED Requirements

### Requirement: Expandable Review Workflows
The system SHALL display CSA schedules in a list view that supports expansion for detailed Line 2 review workflows.

#### Scenario: Accessing the review matrix
- **WHEN** the user views the CSA history in `CSAPage`
- **THEN** each row SHALL be interactive and expandable
- **AND** expansion SHALL reveal the granular transposed matrix (Control x Sample) for design verification
- **AND** the list SHALL support filtering and searching by sub-process name and period.
