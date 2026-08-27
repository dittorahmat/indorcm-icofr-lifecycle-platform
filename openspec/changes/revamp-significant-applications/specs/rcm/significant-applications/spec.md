## Purpose

Provides end-to-end management of Significant IT Applications within the ICOFR lifecycle, enabling direct control-to-application linkage in BPM worksheets and a comprehensive 6-tab application detail modal with live TLC/ITGC control tracking and ITGC domain evidence libraries.

## ADDED Requirements

### Requirement: Significant Application Linkage in Control Editor
The system SHALL provide an optional Significant Applications selection field in the Control Editor / Regulatory Property Sheet, positioned between Sifat Pengendalian (`controlNature`) and Frekuensi (`frequency`).

#### Scenario: Selecting an existing application
- **WHEN** user opens the Control Editor in BPM Editor or Worksheet
- **THEN** user sees the Significant Applications dropdown populated with applications from `/api/applications`
- **WHEN** user selects an application
- **THEN** the control is saved with the associated application identifier

#### Scenario: Creating a new application inline
- **WHEN** user types a new application name that does not exist in the dropdown
- **THEN** the system presents an option to "+ Add [Name]" inline
- **WHEN** user selects this option
- **THEN** the new application is created via the backend and immediately assigned to the control

#### Scenario: Optional application for manual controls
- **WHEN** user creates a manual control that does not rely on IT applications
- **THEN** user can leave the Significant Applications field empty, and saving succeeds without error

### Requirement: Data Independence on Control Deletion
The system SHALL ensure that deleting a control does NOT delete or modify any associated Significant Application records.

#### Scenario: Deleting a linked control
- **WHEN** user deletes a control linked to an application
- **THEN** the control is removed, but the application remains available in the application inventory and continues to be linked to any other associated controls

### Requirement: Interactive Application Detail Modal on /applications
The system SHALL open an interactive 6-tab detail dialog when a user clicks on an application row on the `/applications` page.

#### Scenario: Viewing Tab 1 - RCM TLC
- **WHEN** user clicks on an application and selects the "RCM TLC" tab
- **THEN** the system displays all TLC level controls linked to this application, including control code, description, control owner, key control badge, and testing/CSA status

#### Scenario: Viewing Tab 2 - RCM ITGC
- **WHEN** user clicks on the "RCM ITGC" tab in the application modal
- **THEN** the system displays all ITGC level controls linked to this application across the ITGC domains

#### Scenario: Managing ITGC Domain Evidence Libraries (Tabs 3 - 6)
- **WHEN** user navigates to any of the 4 ITGC domain tabs ("Access to Program and Data", "Program Changes", "Program Development", "Computer Operations")
- **THEN** the system displays the repository of uploaded evidence files for that specific domain and application
- **WHEN** user uploads a new document (PDF, DOCX, JPG, PNG, etc.)
- **THEN** the file is stored, and an audit log record is added showing file name, size, uploader identity, and upload timestamp
- **WHEN** user clicks on an uploaded PDF or image file
- **THEN** an in-app preview modal displays the document content
- **WHEN** user clicks download on any file
- **THEN** the file is downloaded to their device

### Requirement: Cross-Navigation between Detail Modal and RCM/BPM
The system SHALL support jumping from a control item inside the application detail modal to the corresponding BPM or RCM view.

#### Scenario: Jump to BPM or RCM
- **WHEN** user clicks the "View in BPM/RCM" action for a control in the TLC or ITGC tab
- **THEN** the system opens the BPM diagram or RCM page highlighting the target control, with clear navigation available to return to the application detail
