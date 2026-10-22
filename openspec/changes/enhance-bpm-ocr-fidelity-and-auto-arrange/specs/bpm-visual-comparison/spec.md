# Spec Delta

## Purpose

Enables original source diagram preservation and visual reference comparison between uploaded documents and interactive BPM canvas models.

## ADDED Requirements

### Requirement: Source Document Image Retention
The BPM OCR workflow SHALL retain source document image previews within diagram staging and metadata so that the original input reference remains inspectable.

#### Scenario: Staging an uploaded diagram PDF or image
- **WHEN** a user uploads a PDF or image in the OCR modal
- **THEN** the system SHALL retain the page image preview URLs in staging state and attach them to review contexts

### Requirement: Reference Split-View Verification
The OCR review modal SHALL provide a side-by-side or toggled reference view of the original uploaded document against recognized elements.

#### Scenario: Inspecting recognized diagram during review
- **WHEN** the user is in the OCR review stage
- **THEN** the user SHALL be able to view the original source page alongside recognized nodes and connections to verify visual fidelity
