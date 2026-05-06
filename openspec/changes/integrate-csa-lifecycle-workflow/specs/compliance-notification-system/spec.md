## ADDED Requirements

### Requirement: Task Alert Integration
The system SHALL display compliance task alerts in the global notification center, including overdue and upcoming milestones.

#### Scenario: Overdue task alert
- **WHEN** a scheduled ICOFR activity becomes overdue
- **THEN** the system SHALL generate a "warning" level notification visible in the bell menu

### Requirement: Real-time Status Sync in UI
The system SHALL ensure that status changes in the Todo List (e.g., transition to Completed) are reflected in the notification badge count in real-time.

#### Scenario: Clearing notification on completion
- **WHEN** a user completes a task that had an active alert
- **THEN** the system SHALL mark the corresponding notification as read or resolved
