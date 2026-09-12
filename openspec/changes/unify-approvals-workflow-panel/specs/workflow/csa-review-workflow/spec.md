## Purpose

Provides a standardized review and validation workflow for Control Self-Assessments (CSA) between Line 1 assessors and Line 2 ICOFR reviewers.

## ADDED Requirements

### Requirement: Structured CSA Assessment and Validation Lifecycle
The system SHALL support submitting and validating CSA evaluations via the unified WorkflowPanel component across Draft, In Review, and Validated states.

#### Scenario: Line 1 submits CSA worksheet for validation
- **WHEN** Line 1 completes the CSA testing questions and clicks Submit in the WorkflowPanel
- **THEN** the status updates to 'In Review' and sends a review notification to Line 2.

#### Scenario: Line 2 validates CSA worksheet
- **WHEN** Line 2 reviews the submitted CSA evidence and clicks Validate (Approve)
- **THEN** the status transitions to 'Validated', locks the assessment, and triggers auto-deficiency creation if the outcome was Ineffective.

#### Scenario: Demo bypass mode for CSA validation
- **WHEN** VITE_ENABLE_WORKFLOW_APPROVAL is configured as 'false'
- **THEN** the WorkflowPanel displays a bypass button allowing instant validation to 'Validated' state.
