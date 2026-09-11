## Purpose

Turns an uploaded BPM image or PDF into a clean, editable, manually-equivalent React Flow diagram through deterministic auto-layout and interactive pre-apply review.

## ADDED Requirements

### Requirement: Deterministic Auto-Layout of OCR Results

The system SHALL compute final node positions deterministically instead of using raw AI coordinates. AI-provided `x,y` values SHALL be used only as ordering hints. Lanes SHALL be ordered left-to-right by their median AI x-coordinate; nodes inside each lane SHALL be ordered top-to-bottom by flow depth (breadth-first traversal from lane entry points, ties broken by AI y). The final grid SHALL guarantee no two nodes overlap.

#### Scenario: OCR result applied to canvas

- **WHEN** the user applies a parsed diagram containing 4 swimlanes and 13 nodes
- **THEN** all 4 lanes appear side by side without overlapping, and no two nodes share the same canvas area

#### Scenario: Lane order follows source image

- **WHEN** the AI detects lanes DEBITUR, MARKETING, KREDIT ADMIN, PEJABAT BERWENANG from left to right
- **THEN** the laid-out lanes preserve that left-to-right order

### Requirement: Manual-Equivalent Swimlane Dimensions

OCR-generated swimlanes SHALL be at least as large as manually created ones: minimum 400px wide and a uniform height matching the tallest lane. Lanes SHALL be resizable by the user on canvas.

#### Scenario: Small lane detected by AI

- **WHEN** the AI returns a swimlane with width below 400px (or omits dimensions)
- **THEN** the lane is rendered at minimum 400px wide with height equal to the tallest lane, and the user can resize it

### Requirement: Ignored Document Regions and Badges

The OCR parsing SHALL ignore document chrome (letterhead, title block, version/year/page tables, signature/footer blocks) and small RCM risk/control badges. Only flowchart lanes, process shapes, their labels, lane department/function headers, and connector topology with edge labels (e.g. YES/NO) SHALL become nodes and edges.

#### Scenario: Full-page BPM document uploaded

- **WHEN** a full-page scan containing kop, 4 swimlanes, and a signature footer is processed
- **THEN** no nodes are created from header/footer text, no duplicate nodes are created from RCM badges, and decision edge labels such as YES/NO are preserved on the resulting edges

### Requirement: Interactive Pre-Apply Review Canvas

The import dialog SHALL present an interactive preview canvas of the parsed diagram next to a thumbnail of the source image. The user SHALL be able to drag nodes, delete nodes and edges, reconnect edges, and edit labels inside the preview before applying. The dialog SHALL also list all detected edges with rename/delete actions as an alternative to clicking thin connector lines.

#### Scenario: User corrects parse errors before applying

- **WHEN** the user deletes a spurious node, reconnects a wrong edge, and renames a label inside the preview, then clicks Apply
- **THEN** exactly the corrected diagram is committed to the canvas

### Requirement: Overwrite Apply Semantics with Unsaved-Changes Guard

Applying an OCR result SHALL replace the entire canvas (all existing nodes and edges are discarded). If the current diagram has unsaved changes, the system SHALL ask for explicit confirmation before overwriting.

#### Scenario: Apply over an existing diagram

- **WHEN** the user clicks Apply while the canvas contains a previously drawn diagram with unsaved changes
- **THEN** a confirmation prompt appears, and only after confirmation is the canvas fully replaced by the OCR result

### Requirement: OCR Nodes Equivalent to Manual Nodes

Every node created from OCR SHALL behave like a manually created node: draggable, connectable, lockable, deletable, editable through the property sheet, carrying empty regulatory linkage ready for RCM mapping, and regenerating RCM badges through the same mechanism as manual nodes. The canvas SHALL auto-fit the view after Apply.

#### Scenario: Continuing work after OCR import

- **WHEN** the user selects an OCR-imported activity node after applying
- **THEN** the property sheet opens, RCM linkage can be attached, the node can be moved, connected, locked, and deleted exactly like a manual node
