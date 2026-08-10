## MODIFIED Requirements

### Requirement: Role-based Workflow Execution on Deficiency Board
The Deficiency Board SHALL derive the user's role from the authenticated session (`useAuth`) and grant workflow action privileges corresponding to their role or `Admin` override status.

#### Scenario: Admin user views Deficiency Board
- **WHEN** an authenticated user with role `Admin` navigates to the Deficiency Board
- **THEN** all workflow action buttons (`Edit Plan`, `Submit`, `Pass Review`, `Approve`, `Reject`) SHALL be available and functional based on the card status without requiring manual mock role switching.

#### Scenario: Line 2 user views In Review cards
- **WHEN** an authenticated user with role `Line 2` views a card in `In Review` status
- **THEN** the system SHALL present `Pass Review` and `Reject` action buttons on card hover.
