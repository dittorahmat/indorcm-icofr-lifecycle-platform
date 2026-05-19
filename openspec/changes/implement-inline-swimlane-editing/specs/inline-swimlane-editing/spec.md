## ADDED Requirements

### Requirement: Inline Swimlane Header Editing
The BPM Editor SHALL allow users to edit the "Department" and "Function" fields directly on a Swimlane node without opening a separate property sheet.

#### Scenario: Editing Department Label
- **WHEN** a user types a new value into the "Department" input on a Swimlane node
- **THEN** the diagram state SHALL be updated immediately
- **AND** the diagram SHALL be marked as "dirty" (unsaved changes)

#### Scenario: Editing Function Label
- **WHEN** a user types a new value into the "Function" input on a Swimlane node
- **THEN** the diagram state SHALL be updated immediately
- **AND** the diagram SHALL be marked as "dirty" (unsaved changes)

### Requirement: Persistence of Inline Changes
The system MUST ensure that all changes made through inline swimlane inputs are correctly persisted to the backend when the "Save Flow" action is performed.

#### Scenario: Saving Inline Changes
- **WHEN** a user modifies a swimlane label inline and clicks "Save Flow"
- **THEN** the system SHALL send the updated node data to the backend API
- **AND** the changes SHALL be visible when the diagram is reloaded

### Requirement: Visual Clarity for Inline Inputs
The inline inputs on the Swimlane node SHALL be styled to indicate they are editable while maintaining the professional aesthetic of the BPM canvas.

#### Scenario: Hovering over Swimlane Input
- **WHEN** a user hovers over the "Department" or "Function" text on a Swimlane node
- **THEN** the input field SHALL show a subtle background or border to indicate it is interactive
