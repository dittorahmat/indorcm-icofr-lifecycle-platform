## ADDED Requirements

### Requirement: Quantitative Significance Threshold
The system SHALL identify an account as "Quantitatively Significant" if its balance is greater than or equal to the Performance Materiality (PM) threshold.

#### Scenario: Account balance above PM
- **WHEN** an account balance is $1,500,000 and the PM threshold is $1,000,000
- **THEN** the system SHALL mark the account as `isQuantitative: true` and display the status as "Significant" with the reason "> PM".

### Requirement: Qualitative Significance Criteria
The system SHALL allow an account to be marked as "Significant" even if its balance is below the PM threshold, provided it has one or more qualitative risk reasons selected (e.g., "Fraud Risk", "High Judgment").

#### Scenario: Small balance with high risk
- **WHEN** an account balance is $50,000 (below PM) but the user selects "Besarnya eksposur risiko kecurangan" as a reason
- **THEN** the system SHALL mark the account as significant and display the specific qualitative reason in the UI.

### Requirement: Insignificant Account Exclusion
The system MUST NOT mark an account as "Significant" if it neither meets the quantitative threshold nor has qualitative reasons assigned.

#### Scenario: Filtering during GL Upload
- **WHEN** a user uploads a GL file containing accounts below PM
- **THEN** the system SHALL by default exclude these accounts from the Significant Accounts Matrix, or clearly label them as "Insignificant" if displayed.
