## ADDED Requirements

### Requirement: Latest Simulation FSLI Source
The system SHALL retrieve the list of unique FSLI names from the most recent Approved simulation for the selected year. If no Approved simulation exists, it SHALL fall back to the most recent Draft or Pending simulation.

#### Scenario: FSLI Dropdown population in BPM Page
- **WHEN** the user opens the BPM page and a Scoping simulation exists for the selected year
- **THEN** the FSLI dropdown SHALL be populated with unique FSLI names marked as "In Scope" or "Significant" in that simulation

### Requirement: Hierarchical FSLI Dropdown Sorting
The system SHALL sort the FSLI dropdown hierarchicaly based on the minimum `noUrut` of the GL accounts belonging to each FSLI.

#### Scenario: FSLI Dropdown sorting
- **WHEN** the FSLI dropdown is rendered
- **THEN** FSLIs SHALL appear in numeric order of their earliest GL account's `noUrut`

### Requirement: BPM Deep-Link Parameter Support
The system SHALL support deep-linking to specific FSLIs and GL accounts via URL parameters, automatically selecting the corresponding values in the BPM page dropdowns.

#### Scenario: Navigating from Scoping to BPM
- **WHEN** the user clicks a deep-link for FSLI "Cash" and GL "110100" from the Scoping page
- **THEN** the BPM page SHALL automatically set the selected FSLI to "Cash" and the selected GL Account to "110100" upon loading
