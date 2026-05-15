## ADDED Requirements

### Requirement: AI-Enabled CSA Inquiries
The system SHALL allow users to query the status, schedules, and evidence of CSA activities via the AI Assistant.

#### Scenario: Querying overdue CSA via AI
- **WHEN** user asks "What CSA tasks are overdue?"
- **THEN** the AI SHALL call the relevant tool to retrieve past-due `csa_schedules` assigned to the user
- **AND** provide a summarized list with links to the execution pages
