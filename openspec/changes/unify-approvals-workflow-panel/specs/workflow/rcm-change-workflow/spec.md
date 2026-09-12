## Purpose

Provides a standardized multi-stage review and approval lifecycle for RCM / Control change requests with complete audit history and demo-bypass support.

## ADDED Requirements

### Requirement: Multi-stage RCM Change Approval Workflow
The system SHALL provide a structured workflow (Draft -> In Review -> Approved / Rejected) for RCM change requests using the unified WorkflowPanel component.

#### Scenario: Line 1 submits RCM change for Line 2 review
- **WHEN** a Line 1 user initiates a change request and clicks Submit in the WorkflowPanel
- **THEN** the status transitions to 'In Review', assigns the designated reviewer, and logs the action in workflow history.

#### Scenario: Line 2 approves RCM change request
- **WHEN** an authorized Line 2 user clicks Approve with effective date and rationale
- **THEN** the status transitions to 'Approved', the change is applied to the active RCM, and an entry is added to the Master Change Log.

#### Scenario: Demo bypass mode for RCM change approval
- **WHEN** VITE_ENABLE_WORKFLOW_APPROVAL is configured as 'false'
- **THEN** the WorkflowPanel displays a bypass button allowing instant finalization to 'Approved' state.
