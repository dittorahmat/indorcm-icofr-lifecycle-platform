## ADDED Requirements

### Requirement: AI-Enabled Remediation Inquiries
The system SHALL allow users to query action plans, deadlines, and deficiency statuses via the AI Assistant.

#### Scenario: Querying remediation deadlines
- **WHEN** user asks "What remediation plans are due next month?"
- **THEN** the AI SHALL call the relevant tool to retrieve `action_plans` with `dueDate` in the following month
- **AND** return a list of plans with their current status and severity
