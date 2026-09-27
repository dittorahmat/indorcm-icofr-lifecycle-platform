## Purpose

Defines the presentation and editing rules for BPM decision (diamond) branch labels so each branch is stated exactly once — via the arrow (edge) label — with no hardcoded NO/YES baked into the node.

## ADDED Requirements

### Requirement: Plain decision diamond

The system SHALL render a decision node as a plain diamond containing only the question text, with no hardcoded branch labels attached to the node.

#### Scenario: Diamond shows question only
- **WHEN** a decision node (e.g. `MEMENUHI SYARAT?`) is displayed on the canvas in any language
- **THEN** the diamond SHALL show only the question text and SHALL NOT display `NO`, `YES`, `Ya`, or `Tidak` as fixed node adornments in any color.

#### Scenario: Existing diagrams render clean without migration
- **WHEN** a diagram saved before this change is opened
- **THEN** its decision diamonds SHALL render without the old hardcoded labels while preserving the question text, handles, and all edges.

### Requirement: Branch meaning stated via edge label

The system SHALL use the edge (`BridgeEdge`) label as the single source of truth for a decision branch's meaning, rendered as a small box on the arrow.

#### Scenario: Ya / Tidak shown on arrows
- **WHEN** an edge out of a decision node has label `Ya` (or `Tidak`, `Yes`, `No`)
- **THEN** the canvas SHALL display that text in the edge-label box on the corresponding arrow.

#### Scenario: Unlabeled non-branch arrow shows no box
- **WHEN** an edge has an empty label
- **THEN** the canvas SHALL render the arrow with no label box.

### Requirement: Edge label editable on the main canvas

The system SHALL allow the user to view and edit the selected edge's label on the main canvas, localized in English and Indonesian, with changes integrated into undo and dirty-tracking.

#### Scenario: Editing a branch label
- **WHEN** the user selects an arrow out of a decision node and types `Tidak` (committed via Enter or blur)
- **THEN** the system SHALL update that edge's label, mark the diagram dirty, and make the change undoable, with the new label visible on the arrow immediately.

#### Scenario: Locked diagram disables editing
- **WHEN** the diagram is locked
- **THEN** the edge-label input SHALL be disabled.

#### Scenario: Localized editor UI
- **WHEN** the UI language is English
- **THEN** the label input SHALL show placeholder `Add label…` (and hint text in English), and **WHEN** Indonesian it SHALL show `Tambah label…` (and hint in Indonesian), with no hardcoded UI strings.
