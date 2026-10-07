## Purpose

Provides a flexible and non-destructive mechanism to import OCR diagrams into the BPM canvas by allowing users to choose between overwriting the canvas or appending newly recognized elements with collision-free positioning and ID isolation.

## ADDED Requirements

### Requirement: Import Mode Selection
The system SHALL provide an explicit import mode selector in the OCR review interface when applying OCR recognized elements to the BPM canvas. The available modes SHALL be "Overwrite" and "Append".

#### Scenario: Canvas is empty
- **WHEN** user opens OCR review and the canvas currently has no nodes
- **THEN** the system defaults to applying elements directly without collision warnings or confirmation of overwrite

#### Scenario: User selects Overwrite mode on non-empty canvas
- **WHEN** user selects "Overwrite" and confirms application
- **THEN** existing nodes and edges on the canvas are replaced with the newly imported elements

#### Scenario: User selects Append mode on non-empty canvas
- **WHEN** user selects "Append" and applies the import
- **THEN** existing canvas nodes and edges are preserved, and new elements are added to the existing diagram

### Requirement: Configurable Append Direction
The system SHALL allow the user to select the append direction when "Append" mode is chosen. The available directions SHALL be "Below (Vertical)" and "Right (Horizontal)".

#### Scenario: User chooses Append Below
- **WHEN** user selects "Append" with direction "Below"
- **THEN** new elements are placed below the bottom-most boundary (maximum Y + margin) of the existing nodes

#### Scenario: User chooses Append Right
- **WHEN** user selects "Append" with direction "Right"
- **THEN** new elements are placed to the right of the right-most boundary (maximum X + margin) of the existing nodes

### Requirement: Collision-Free Positioning and ID Isolation
The system SHALL calculate bounding-box offsets and generate collision-free unique IDs for all appended nodes and edges to prevent element overlap and reference corruption.

#### Scenario: Appended nodes share duplicate IDs with existing nodes
- **WHEN** incoming OCR elements have IDs matching existing nodes on canvas
- **THEN** the system re-maps incoming node IDs and updates all incoming edge source/target references accordingly before adding them to canvas

#### Scenario: Preserving canvas undo and dirty state
- **WHEN** elements are appended to the canvas
- **THEN** canvas dirty state is marked as true and an undo checkpoint is recorded so the user can revert the append action
