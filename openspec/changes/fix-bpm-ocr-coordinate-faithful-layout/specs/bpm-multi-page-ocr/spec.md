# Spec Delta

## ADDED Requirements

### Requirement: Geometry-Faithful OCR Layout
The OCR layout engine SHALL preserve the vertical ordering extracted from the source drawing: nodes belonging to the same source row MUST land on the same global row across all swimlanes, and nodes above another node in the source MUST NOT be placed below it.

#### Scenario: Cross-lane nodes stay side by side
- **WHEN** a document in one swimlane and an activity in another share the same source row
- **THEN** both nodes are placed on the same global row and their connecting edge is horizontal

#### Scenario: No invented backward cross-lane flow
- **WHEN** an extracted edge runs downward or sideways in the source drawing
- **THEN** the layout MUST NOT place its target above its source
- **AND** an edge that is already upward in the source (a real hand-off or a loop) MUST stay upward and MUST be reported through the audit's `upwardEdgeIds`, never flipped into a downward edge

#### Scenario: Lane bounds follow content
- **WHEN** the deepest lane child ends at a given vertical position
- **THEN** every swimlane height MUST be that position plus a footer padding, shared as one uniform band so the lanes stay aligned, and MUST NOT keep a fixed empty band below the content
- **AND** a lane with no children MUST fall back to the minimum band, not the historical 1000px

### Requirement: Coordinate Validity Fallback
The OCR layout engine SHALL detect unusable extracted geometry and fall back to its rank-based layout instead of producing a degenerate diagram.

#### Scenario: Degenerate coordinates
- **WHEN** most extracted nodes share one `y` value, or the vertical spread is below the minimum usable threshold
- **THEN** the engine SHALL ignore the coordinates and lay the diagram out by topological rank

#### Scenario: Usable coordinates
- **WHEN** extracted `y` values are sufficiently distinct across the drawing
- **THEN** the engine SHALL use the coordinate-anchored layout

### Requirement: Normalized OCR Geometry Contract
The OCR extraction response SHALL carry enough geometry to place each shape: `position` is the shape's top-left corner in a 0–1000 normalized space, and lane nodes additionally describe their own bounding box in that same space.

#### Scenario: Extracted node geometry
- **WHEN** the vision model returns a flow shape
- **THEN** it supplies `position.x`/`position.y` as the top-left corner plus optional `width`/`height` expressed in the same normalized space

#### Scenario: Geometry preserved, not reflowed
- **WHEN** the model describes a shape that sits low in its column
- **THEN** the returned `y` reflects that low position and MUST NOT be normalized to the top of the column

#### Scenario: Connectors and drawing chrome
- **WHEN** the drawing contains arrows, a page frame, header/tables, or a sign-off block
- **THEN** every visible arrow MUST become one edge, so an empty edge list is valid only for a drawing without arrows
- **AND** the page frame, column borders, header/tables and sign-off boxes MUST NOT be emitted as flow shapes
- **AND** extracted `width`/`height` serve as validation inputs (missing/undersized dimensions warn); rendered box sizes come from the node registry, never from the normalized numbers

### Requirement: Legible Landing View After OCR Import
After applying an OCR import, the canvas SHALL present the diagram at a readable zoom instead of fitting the whole drawing into the viewport.

#### Scenario: Applying a four-lane imported diagram
- **WHEN** the user applies a multi-lane OCR result
- **THEN** the canvas lands at a zoom of at least 0.7, positioned so the first process step is visible, and remains pannable

#### Scenario: Applying a multi-page import as sheets
- **WHEN** the import becomes several sheets instead of the current canvas
- **THEN** the canvas still lands at a zoom of at least 0.7 anchored to the sheet origin instead of fitting everything

#### Scenario: User requests full overview
- **WHEN** the user activates "Fit to Screen"
- **THEN** the canvas still zooms out to show the whole diagram on demand

### Requirement: Shapes Outside Lanes
The OCR layout engine SHALL keep shapes that carry no swimlane parent arranged like the source sheet instead of forcing them into a single row.

#### Scenario: Flow chart with a sign-off table
- **WHEN** the drawing is a flow chart in the upper half and the extracted "swimlanes" are the sign-off columns in the lower half
- **THEN** shapes without a lane MUST keep their relative source arrangement, in columns, with at least 40px clearance
- **AND** the block that sits higher in the source (flow or lane block) MUST stay higher on the canvas
- **AND** lane bands with no children MUST be sized from content (minimum 300px), never a fixed 1000px empty band

### Requirement: Deterministic OCR Sampling
The OCR extraction call SHALL run at temperature 0 so that repeated imports of the same drawing yield the same shapes and connectors, while every other AI feature keeps the provider's default sampling.

#### Scenario: Repeated import of one drawing
- **WHEN** the same drawing is sent to `POST /bpm-diagrams/ocr` more than once
- **THEN** each extraction call MUST use temperature 0, and omitting the parameter anywhere else MUST leave the provider default untouched

## MODIFIED Requirements

### Requirement: Dynamic Swimlane Width Based on Parallel Branching
The OCR layout engine SHALL dynamically compute swimlane widths based on the maximum number of concurrent/parallel nodes positioned within any single rank of that swimlane.

#### Scenario: Single vertical flow in swimlane
- **WHEN** all nodes in a swimlane follow a single sequential chain
- **THEN** the swimlane width SHALL be sized to standard minimum width accommodating a single node column

#### Scenario: Multiple parallel nodes in a swimlane rank
- **WHEN** a swimlane contains two or more sibling nodes sharing the same topological rank or the same global row
- **THEN** the swimlane width MUST expand proportionally to accommodate all concurrent nodes side-by-side with clear separation

### Requirement: Anti-Clumping Clearance in OCR Layout
The OCR layout engine SHALL enforce sufficient vertical and horizontal clearance between adjacent nodes to prevent visual overlap.

Clearance is measured against each node's rendered height, including the extra height produced by a wrapped multi-line label.

#### Scenario: Sequential nodes within swimlane
- **WHEN** sequential nodes are arranged vertically in a lane
- **THEN** the vertical spacing between the bottom of a predecessor node and the top of a successor node MUST maintain a minimum clearance of at least 40px

#### Scenario: Wrapped label expands node height
- **WHEN** a node label wraps to several lines and the rendered node is taller than the node type's default height
- **THEN** the reserved row height MUST use the wrapped height, and no following node may overlap the rendered shape

#### Scenario: Sibling nodes in the same rank
- **WHEN** multiple nodes are placed in the same rank within a swimlane
- **THEN** the horizontal clearance between adjacent sibling nodes MUST maintain a minimum separation of at least 40px

### Requirement: Layout Clearance for Unlinked Document Clusters
The OCR layout engine SHALL space unlinked document clusters within a swimlane so they do not overlap vertically or horizontally.

Unlinked nodes keep the relative order they occupy in the source drawing instead of being pushed one rank below the previous node.

#### Scenario: Multiple unlinked input documents in initial lane
- **WHEN** an OCR diagram contains multiple document nodes in a swimlane with no direct mutual connections
- **THEN** each document node MUST be placed with a minimum vertical clearance of 40px and centered or distributed across the lane width

#### Scenario: Unlinked documents preserve source order
- **WHEN** unlinked documents are stacked at different heights in the source drawing
- **THEN** the vertical order of those documents on the canvas MUST match the source order

