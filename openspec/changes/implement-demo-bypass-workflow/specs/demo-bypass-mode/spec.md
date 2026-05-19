## ADDED Requirements

### Requirement: Demo Bypass Toggle
The system SHALL support an environment-variable-driven toggle to enable or disable the standard workflow approval process.

#### Scenario: Enabling bypass mode
- **WHEN** the environment variable `VITE_ENABLE_WORKFLOW_APPROVAL` is set to `'false'`
- **THEN** the system SHALL enter Demo Bypass Mode
- **AND** it SHALL provide a mechanism to instantly approve documents

### Requirement: Instant Approval Button
In Demo Bypass Mode, the `WorkflowPanel` SHALL display a specialized button that bypasses all intermediate approval stages.

#### Scenario: Using the bypass button
- **WHEN** a user clicks the "Bypass Approval" button in the `WorkflowPanel`
- **THEN** the system SHALL immediately execute the final approval logic (e.g., calling `onApprove`)
- **AND** it SHALL transition the document status to its final 'Approved' or 'Locked' state

### Requirement: Bypass Mode Visual Indicator
The system SHALL display a clear visual indicator when Demo Bypass Mode is active to inform the user that standard regulatory controls are currently relaxed.

#### Scenario: Visual confirmation of demo mode
- **WHEN** the system is in Demo Bypass Mode
- **THEN** the `WorkflowPanel` SHALL display a warning banner or distinctive styling (e.g., Amber background with "Demo Mode Active" text)
