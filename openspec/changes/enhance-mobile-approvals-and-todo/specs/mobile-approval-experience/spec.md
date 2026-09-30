## Purpose

Provides mobile-optimized workflows for review, sign-off, and agenda tracking in the ICOFR governance lifecycle, including responsive bottom sheets, quick note presets, and executive summary cards.

## ADDED Requirements

### Requirement: Mobile Drawer Approval Interface
The system SHALL present approval and rejection workflows inside a touch-friendly bottom sheet (Drawer) rather than a desktop dialog when the viewport width is below 768px.

#### Scenario: User opens approval on mobile
- **WHEN** a user on a mobile viewport (< 768px) triggers an approval or rejection action in the WorkflowPanel
- **THEN** the system displays a bottom sheet anchored to the lower screen edge with touch swipe-to-dismiss behavior and full button hit areas (minimum 44x44px)

### Requirement: Quick Preset Approval Notes
The system SHALL offer pre-defined institutional comment chips for rapid feedback during mobile review actions to minimize virtual keyboard entry.

#### Scenario: User applies quick preset note
- **WHEN** the user selects a preset chip such as "Disetujui sesuai lampiran" in the mobile approval interface
- **THEN** the note text input is automatically populated with the chosen text and remains editable

### Requirement: Mobile Executive Summary for CSA Records
The system SHALL provide a compact executive summary card view on mobile viewports displaying control effectiveness rate, validation status, and rapid sign-off triggers.

#### Scenario: User views CSA records on mobile
- **WHEN** a user accesses the CSA page on a mobile device (< 768px)
- **THEN** an executive summary card is presented above the record list highlighting current control health metrics and pending review counts without horizontal table overflow
