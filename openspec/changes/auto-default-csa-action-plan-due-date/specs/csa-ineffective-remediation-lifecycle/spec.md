## Purpose

Ensures a seamless and regulatorily-compliant remediation lifecycle across Lini 1, 2, and 3 when a CSA or TOD result is evaluated as Ineffective, including fiscal year-end due date fallbacks and audit testing gatekeeper locks.

## ADDED Requirements

### Requirement: Auto-Creation of Remediation Action Plan with Fiscal Year-End Due Date
When a control evaluation in CSA or TOD verification concludes as Ineffective, the system SHALL automatically create a deficiency record and an associated action plan in Ineffective status, with both dueDate and targetDate defaulted to December 31st of the active fiscal year.

#### Scenario: CSA or TOD submission is ineffective
- **WHEN** a user submits a CSA evaluation or TOD verification with result "Ineffective"
- **THEN** the system creates a deficiency record and an action_plans record with workflowStatus 'Ineffective'
- **THEN** the action_plans record has dueDate and targetDate set to December 31st of the active fiscal year
- **THEN** the Kanban board renders this plan in the Ineffective column with the fiscal year-end due date instead of 1970

### Requirement: Lini 3 Testing Gatekeeper for Ineffective Controls
The system SHALL freeze and prevent Lini 3 (Internal Audit) TOE testing for any control that has an active, unresolved CSA ineffective deficiency, per SK-5/2024 BAB V Hal. 54.

#### Scenario: Auditor views a pending ineffective control in Test Workbench
- **WHEN** an auditor opens Test Workbench for a control with an unresolved CSA ineffective deficiency
- **THEN** the system displays a regulatory banner indicating the control cannot be tested until remediation is Resolved
- **THEN** the testing submission button is disabled for that control

### Requirement: Deficiency Board Action Plan Terminology and Safe Date Formatting
The system SHALL provide an "Action Plan" button in the Ineffective Kanban column and safely format all due dates without epoch 1970 downfalls.

#### Scenario: User interacts with an ineffective deficiency card
- **WHEN** a user views a card in the Ineffective column on the Deficiency Board
- **THEN** the action button is labeled "Action Plan"
- **THEN** if dueDate is null or missing, the card displays a safe fallback rather than 1/1/1970, and does not trigger false OVERDUE status
