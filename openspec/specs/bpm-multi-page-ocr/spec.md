# bpm-multi-page-ocr Specification

## Purpose
Enables end-to-end OCR diagram extraction from multi-page PDF documents, generating structured multi-sheet BPM diagrams with automatically paired Off-Page connectors.

## Requirements

### Requirement: Multi-Page PDF Document Detection and Page Rendering
The system SHALL detect the total number of pages in an uploaded PDF document and extract each page into an image for OCR processing.

#### Scenario: Single-page PDF or image upload
- **WHEN** a user uploads an image or a 1-page PDF
- **THEN** the system SHALL process the single page as a standard single diagram import without pagination overhead

#### Scenario: Multi-page PDF upload
- **WHEN** a user uploads a PDF containing multiple pages (e.g. 3 pages)
- **THEN** the system SHALL detect all pages, report total page count, and render each page sequentially into an optimized high-resolution image

### Requirement: Batch OCR Processing with Progress Feedback
The system SHALL process multi-page PDFs through the vision OCR engine with clear progress feedback for each page.

#### Scenario: Progressive OCR extraction
- **WHEN** OCR processing begins for a multi-page PDF
- **THEN** the system SHALL display progress (e.g. "Menganalisis halaman X dari Y...") and handle partial failures gracefully

### Requirement: Automatic Off-Page Connector Linking Across Pages
The system SHALL inspect recognized Off-Page Reference nodes and automatically establish target page/sheet links based on text patterns.

#### Scenario: Linking "Ke hal X" to destination sheet
- **WHEN** an outgoing connector node on page 1 contains text pointing to page 2 (e.g. "Ke hal 2" or "Ke Hal 2")
- **THEN** the system SHALL populate `targetSheetId` / `targetSheetName` linking to sheet 2, enabling immediate jump navigation upon diagram import

### Requirement: Multi-Sheet Canvas Population
The system SHALL apply multi-page OCR results as discrete sheets within the BPM Editor.

#### Scenario: Applying multi-page OCR to canvas
- **WHEN** a user confirms and applies the multi-page OCR review
- **THEN** the system SHALL create discrete diagram sheets for each processed page, preserve all nodes and edges within each respective sheet, and activate Sheet 1

### Requirement: Dynamic Swimlane Width Based on Parallel Branching
The OCR layout engine SHALL dynamically compute swimlane widths based on the maximum number of concurrent/parallel nodes positioned within any single rank of that swimlane.

#### Scenario: Single vertical flow in swimlane
- **WHEN** all nodes in a swimlane follow a single sequential chain
- **THEN** the swimlane width SHALL be sized to standard minimum width accommodating a single node column

#### Scenario: Multiple parallel nodes in a swimlane rank
- **WHEN** a swimlane contains two or more sibling nodes sharing the same topological rank
- **THEN** the swimlane width MUST expand proportionally to accommodate all concurrent nodes side-by-side with clear separation

### Requirement: Anti-Clumping Clearance in OCR Layout
The OCR layout engine SHALL enforce sufficient vertical and horizontal clearance between adjacent nodes to prevent visual overlap.

#### Scenario: Sequential nodes within swimlane
- **WHEN** sequential nodes are arranged vertically in a lane
- **THEN** the vertical spacing between the bottom of a predecessor node and the top of a successor node MUST maintain a minimum clearance of at least 40px

#### Scenario: Sibling nodes in the same rank
- **WHEN** multiple nodes are placed in the same rank within a swimlane
- **THEN** the horizontal clearance between adjacent sibling nodes MUST maintain a minimum separation of at least 40px

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
