# Spec Delta

## ADDED Requirements

### Requirement: Layout Clearance for Unlinked Document Clusters
The OCR layout engine SHALL space unlinked document clusters within a swimlane so they do not overlap vertically or horizontally.

#### Scenario: Multiple unlinked input documents in initial lane
- **WHEN** an OCR diagram contains multiple document nodes in a swimlane with no direct mutual connections
- **THEN** each document node MUST be placed with a minimum vertical clearance of 40px and centered or distributed across the lane width

### Requirement: Always-Visible Workflow Action Bar
The BPM canvas toolbar SHALL render primary persistence controls (such as Save Workflow) so they remain accessible and visible across laptop and compact desktop viewports without getting occluded.

#### Scenario: Viewing canvas toolbar on compact desktop viewport
- **WHEN** the BPM editor is opened on a screen width between 1024px and 1280px with full toolbars
- **THEN** the Save Workflow button MUST remain reachable and clickable without requiring out-of-screen scrolling
