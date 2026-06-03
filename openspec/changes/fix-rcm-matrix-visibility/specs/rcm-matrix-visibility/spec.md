## ADDED Requirements

### Requirement: Matrix visibility without diagram nodes
The RCM Matrix views (TLC and ITGC) SHALL display all Risks and Controls mapped to the organization, regardless of whether they have been assigned to a visual node in a BPM diagram.

#### Scenario: Displaying migrated RCM data
- **WHEN** user uploads RCM data via CSV and navigates to the RCM TLC Matrix
- **THEN** system SHALL show all uploaded Risks and Controls in the table

### Requirement: Fallback process metadata
When an RCM is not linked to a diagram node, the Matrix SHALL display the Process and Sub-process names stored in the `rcms` table as a fallback.

#### Scenario: Fallback display
- **WHEN** an RCM record has no entry in `bpm_node_rcms`
- **THEN** system SHALL display the process name from the `rcms` table in the "Process Info" column
