# bpm-multi-sheet Specification

## Purpose
Provides a modular multi-sheet canvas architecture for BPM diagrams with interactive off-page connectors and multi-page PDF generation aligned with Regulation SK-5/DKU.MBU/11/2024.

## Requirements

### Requirement: Multi-Sheet BPM Data Storage and Backward Compatibility
The system SHALL support storing and loading BPM diagrams composed of multiple sheets while maintaining non-breaking backward compatibility with legacy single-canvas diagrams.

#### Scenario: Loading a legacy single-canvas diagram
- **WHEN** a user opens an existing diagram that lacks a `sheets` definition in `metadata`
- **THEN** the system SHALL treat the existing `nodes` and `edges` as "Sheet 1 (Default)" without mutating database records until explicitly saved

#### Scenario: Creating and switching between sheets
- **WHEN** a user adds a new sheet via the tab bar
- **THEN** the system SHALL generate a unique sheet identifier, initialize a blank canvas with a default start node, preserve the state of previous sheets, and allow switching active sheets without state loss

### Requirement: Interactive Off-Page Reference Linking
The system SHALL support linking outgoing Off-Page Reference nodes ("Ke hal X") to target sheets and incoming Off-Page Reference nodes ("Dari hal X") in compliance with Lampiran 3 SK-5.

#### Scenario: Configuring target sheet on Off-Page node
- **WHEN** an author edits properties of an `off-page-ref` node
- **THEN** the system SHALL provide a selector allowing the author to link the node to an existing target sheet within the diagram

#### Scenario: In-canvas jump navigation
- **WHEN** a user clicks an outgoing `off-page-ref` connector in the canvas
- **THEN** the system SHALL immediately switch the active canvas tab to the linked target sheet and focus the viewport on the corresponding target connector node

### Requirement: Multi-Page PDF Export with Internal Hyperlinks
The system SHALL export multi-sheet diagrams into a sequential multi-page PDF where each sheet corresponds to one page conforming to Lampiran 4 SK-5 formatting and containing clickable internal links.

#### Scenario: Exporting multi-sheet diagram to PDF
- **WHEN** a user triggers the "Export PDF" action on a multi-sheet diagram
- **THEN** the system SHALL render each sheet onto its own landscape page, format page headers with "Hal X dari N", and place clickable PDF internal link annotations on Off-Page connectors pointing to target page numbers

### Requirement: Import Mode Differentiation in OCR / Upload
The system SHALL allow users to differentiate between single-canvas (legacy) and multi-sheet import modes when uploading diagram files or processing OCR.

#### Scenario: Uploading multi-page diagram
- **WHEN** a user uploads a multi-page PDF in the BPM OCR/Import modal
- **THEN** the system SHALL offer an option to import as a Multi-Sheet diagram where each PDF page populates an independent sheet with connected references
