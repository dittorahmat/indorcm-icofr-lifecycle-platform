## MODIFIED Requirements

### Requirement: Sectioned RCM Edit Dialog
The system SHALL replace inline editing with a `RCMEditDialog` that breaks down the 34 columns into logical, navigable sections, while maintaining full identity integrity of the records.

#### Scenario: Tabbed/Sectioned Layout
- **WHEN** editing a control mapping
- **THEN** the dialog MUST group fields into at least 3 categories: General Info, Risk & Control Details, and Compliance Matrix (IPO/Asersi).

#### Scenario: Real-time isDirty Tracking
- **WHEN** any field in the `RCMEditDialog` is modified
- **THEN** the component MUST update the `isDirty` state and notify the `unsaved-changes-guard`.

#### Scenario: Identity Integrity
- **WHEN** the `RCMEditDialog` is initialized with data or submits values
- **THEN** it MUST preserve the underlying `id` and `mappingId` to ensure the correct record is targeted by the backend API.
