## Purpose

Defines the select-vs-edit interaction contract for BPM canvas nodes so single-click only selects (drag/delete ready) while opening the Regulatory Property Worksheet requires an explicit edit intent via double-click, HUD action, or keyboard.

## ADDED Requirements

### Requirement: Single-click selects node without opening worksheet
The system SHALL select a BPM node on single-click and MUST NOT open the Regulatory Property Worksheet. Selection SHALL surface highlight plus the selection HUD.

#### Scenario: Single-click activity node
- **WHEN** the user single-clicks an editable node (e.g. activity, decision, document)
- **THEN** the node becomes selected, the selection HUD appears, and the property worksheet stays closed

#### Scenario: Single-click then drag or delete
- **WHEN** the user single-clicks a node and then drags it or presses Delete (or HUD Delete)
- **THEN** the drag/delete operates immediately without needing to dismiss any dialog

### Requirement: Double-click opens Regulatory Property Worksheet
The system SHALL open the Regulatory Property Worksheet for the double-clicked node.

#### Scenario: Double-click activity node
- **WHEN** the user double-clicks an editable node
- **THEN** the node becomes selected (if not already) and the property worksheet opens for that node

#### Scenario: Double-click swimlane
- **WHEN** the user double-clicks a swimlane node
- **THEN** the swimlane becomes selected and its property sheet opens (visual properties + history tabs, no RCM section)

### Requirement: HUD provides explicit edit affordance
The system SHALL provide an Edit/Properties action in the selection HUD that opens the worksheet for the currently selected node, as a discoverable and touch-friendly alternative to double-click.

#### Scenario: Open worksheet from HUD
- **WHEN** a node is selected and the user activates the HUD Edit/Properties action
- **THEN** the property worksheet opens for that selected node

#### Scenario: Touch device without double-click
- **WHEN** the user on a touch device taps a node (select) then taps HUD Edit
- **THEN** the worksheet opens without requiring double-tap gestures

### Requirement: Keyboard opens worksheet from selection
The system SHALL open the worksheet when the user presses Enter while a canvas node is selected (and not editing text input).

#### Scenario: Enter key on selected node
- **WHEN** a node is selected, focus is on canvas (not in input/textarea), and the user presses Enter
- **THEN** the property worksheet opens for the selected node

### Requirement: Risk-control badge nodes are ignored
The system SHALL ignore both select and edit intents on `risk-control-badge` (and docked-risk/docked-control helper types): neither selection nor worksheet SHALL trigger.

#### Scenario: Click badge
- **WHEN** the user single- or double-clicks a risk-control badge element
- **THEN** selection stays unchanged and no worksheet opens

### Requirement: Closing worksheet preserves selection
Closing the Regulatory Property Worksheet (X, overlay close, or discard-confirm) SHALL keep the node selected so follow-up actions (drag/delete/re-edit) work immediately. Clearing selection SHALL require an explicit pane-click, HUD clear (X), or Esc with no dialog open.

#### Scenario: Close worksheet keeps selection
- **WHEN** the user closes the worksheet via X button
- **THEN** the dialog closes and the same node remains selected with HUD visible

#### Scenario: Pane-click clears selection
- **WHEN** the user clicks empty canvas pane with no dialog open
- **THEN** both selection and any open worksheet state are cleared

### Requirement: Edge interaction unchanged
Single-click on an edge SHALL continue to select the edge and show the inline label editor in the HUD, and MUST NOT open the node property worksheet.

#### Scenario: Click edge
- **WHEN** the user single-clicks a connection edge
- **THEN** the edge becomes selected, node selection clears, and the HUD shows the edge label input (no dialog opens)

### Requirement: Discoverability and localization
The HUD edit action and any hint text SHALL use localized strings (namespace `bpm`) and the HUD SHALL expose a tooltip/title indicating double-click also opens properties. No hardcoded Indonesian/English strings in UI.

#### Scenario: Indonesian locale
- **WHEN** the app runs in Indonesian locale and a node is selected
- **THEN** the HUD Edit action label/tooltip renders the Indonesian translation
