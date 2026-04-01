## ADDED Requirements

### Requirement: Lini 1 and Lini 2 Coordination for Design Remediation
The system MUST provide a formal coordination workflow for remediating design deficiencies. Lini 1 SHALL be able to submit a remediation plan for review, and Lini 2 SHALL be able to approve or reject the plan based on the proposed control redesign.

#### Scenario: Submitting a plan for review
- **WHEN** a Lini 1 user fills in the remediation plan for a "Design" deficiency and clicks "Submit for Review"
- **THEN** the action plan status SHALL change to "In Review" and be visible to Lini 2 users for approval

#### Scenario: Lini 2 approves remediation plan
- **WHEN** a Lini 2 user reviews an "In Review" plan and clicks "Approve"
- **THEN** the plan SHALL move to "In Progress" status
