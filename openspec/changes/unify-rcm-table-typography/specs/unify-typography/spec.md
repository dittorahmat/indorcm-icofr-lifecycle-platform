## ADDED Requirements

### Requirement: Uniform Font Size and Family Across All RCM Matrix Columns
The system SHALL display all cell values within the RCM (TLC, ELC, and ITGC) matrices using a uniform font style (`text-xs`), family (standard sans-serif), weight (`font-normal`), and color (`text-slate-700`) to guarantee high readability and data density.

#### Scenario: Verify RCM data cell styles
- **WHEN** user loads any RCM Matrix page (TLC, ELC, or ITGC)
- **THEN** all data columns (including Process Info, Sub Process, Executing Company, and Risk Description) render text with identical size, family, weight, and color styles.
