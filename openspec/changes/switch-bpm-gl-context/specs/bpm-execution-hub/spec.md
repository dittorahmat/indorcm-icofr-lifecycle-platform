## MODIFIED Requirements

### Requirement: Editor GL Account Configuration
The Visual BPM Editor SHALL allow users to associate the current diagram / sub-process with multiple GL codes via a searchable dropdown checkbox (multi-select) component, and SHALL provide a distinct navigation list to switch the active editor view's GL context.

#### Scenario: Selecting and saving multiple GL codes
- **WHEN** the user opens the "Linked GL Accounts" dropdown in the BPM Editor
- **THEN** the dropdown SHALL display all GL accounts under the selected FSLI, with the originating/current GL code pre-selected by default
- **AND WHEN** the user selects additional GL codes and saves the diagram
- **THEN** the backend SHALL store these associations in the database
- **AND** the sub-process SHALL be displayed in the BPMPage for all associated GL codes

#### Scenario: Switching active GL context in the Editor
- **WHEN** the user clicks an associated GL code link in the "Switch Context" list of the Linked GLs popover
- **THEN** the BPM Editor SHALL switch its active view to that GL's context, update the URL search parameters (`noGL` and `glDesc`), and reload the diagram and RCM data for that GL
- **AND WHEN** the user closes the BPM Editor
- **THEN** the parent BPMPage SHALL read the updated URL search parameters and display the BPM process list for the newly selected GL context
