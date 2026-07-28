## ADDED Requirements

### Requirement: Render Control Type, Control Nature, and Frequency inputs
The `RegulatoryPropertySheet` component MUST render select dropdown inputs for `Control Type`, `Control Nature`, and `Frequency` inside each control item panel within the BPM node property drawer.

#### Scenario: User views node control properties
- **WHEN** the user opens the Regulatory Property Sheet for a BPM process node and expands a control item
- **THEN** the UI displays selectable fields for Control Type (`Preventif`, `Detektif`), Control Nature (`Manual`, `Otomatis`, `ITDM - EUC`, `ITDM - IPE`, `MRC`), and Frequency (`Tahunan`, `Semesteran`, `Kuartalan`, `Bulanan`, `Mingguan`, `Harian`, `Ad-hoc`)

### Requirement: Persist selected property values to regulatoryPairs
The system MUST update and persist `controlType`, `controlNature`, and `frequency` in the node's `regulatoryPairs` state when a user changes any of these fields.

#### Scenario: User changes Control Nature or Frequency
- **WHEN** the user selects a new value for Control Nature or Frequency in the sheet and clicks Save & Sync
- **THEN** the selected values are stored in the node's `regulatoryPairs` array and synchronized to the RCM database

### Requirement: Default property initialization for newly added controls
The system MUST provide appropriate default values or fallback options when adding a new risk or control pair.

#### Scenario: User adds a new control pair
- **WHEN** the user clicks "Tambah Risiko Baru" or "Add Control"
- **THEN** the newly created control object initializes with default or empty values for `controlType`, `controlNature`, and `frequency` without throwing errors
