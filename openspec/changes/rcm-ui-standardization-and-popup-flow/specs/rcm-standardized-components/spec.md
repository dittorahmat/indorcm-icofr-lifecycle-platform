# rcm-standardized-components Specification

## Purpose
This capability provides a unified, reusable architectural pattern for RCM (Risk Control Matrix) data grids and their corresponding edit interfaces across ELC, TLC, and ITGC levels. It ensures that any UI/UX improvements, accessibility fixes, or regulatory formatting updates are applied consistently throughout the audit lifecycle platform.

## Requirements

### Requirement: Unified RCM Table Component
The system SHALL provide a shared `RCMTable` component capable of rendering the 34-column matrix with advanced visual features.

#### Scenario: Support for Multi-Level Headers
- **GIVEN** a set of RCM data
- **THEN** the table header MUST display two tiers: 
    1. A top tier grouping columns into "Identitas Proses", "Risiko", "Pengendalian", "Asersi", and "Metadata".
    2. A bottom tier with the specific regulatory labels (i through xxxiv).

#### Scenario: Grouped Data Rows
- **WHEN** data belongs to the same Process/Sub-process
- **THEN** the table SHOULD render a "Group Header" row that spans all columns, displaying the process title once, instead of repeating it in every row.

#### Scenario: Vertical and Horizontal Guides
- **THEN** the table MUST render strong horizontal borders between all rows.
- **THEN** the table MUST render a distinct vertical border every 5 columns to aid eye-tracking.

### Requirement: Sectioned RCM Edit Dialog
The system SHALL replace inline editing with a `RCMEditDialog` that breaks down the 34 columns into logical, navigable sections.

#### Scenario: Tabbed/Sectioned Layout
- **WHEN** editing a control mapping
- **THEN** the dialog MUST group fields into at least 3 categories: General Info, Risk & Control Details, and Compliance Matrix (IPO/Asersi).

#### Scenario: Real-time isDirty Tracking
- **WHEN** any field in the `RCMEditDialog` is modified
- **THEN** the component MUST update the `isDirty` state and notify the `unsaved-changes-guard`.

### Requirement: Standardized Typography
The system SHALL enforce a strict typographic scale across all RCM components.

#### Scenario: Header Styling
- **THEN** headers MUST use a Semibold, Uppercase font at 11px with defined letter-spacing.

#### Scenario: Narrative vs Metadata Font
- **THEN** narrative fields (Descriptions) MUST use a 12px Sans font.
- **THEN** metadata fields (Codes, GL Numbers) MUST use an 11px Monospace font for better alignment.
