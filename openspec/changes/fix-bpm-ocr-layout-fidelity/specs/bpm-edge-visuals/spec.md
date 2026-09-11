## ADDED Requirements

### Requirement: Selectable Edge Hit-Area

Every BPM edge SHALL provide an invisible hit-area wide enough to be reliably clicked and selected with a pointer (minimum 20px interaction width), independent of the visible 2px stroke. Selection SHALL highlight the edge and allow deletion via keyboard (Delete/Backspace) and via the edge list in the OCR review dialog.

#### Scenario: Deleting a dense-diagram edge

- **WHEN** the user clicks near (within the hit-area of) a connector line in a dense diagram with crossing edges
- **THEN** that edge becomes selected and can be deleted with the Delete key

#### Scenario: Deleting an edge from the review list

- **WHEN** the user removes an edge through the OCR review dialog's edge list
- **THEN** the edge is removed from the preview canvas without requiring a canvas click
