## ADDED Requirements

### Requirement: Assertion Library Lookup
The system SHALL provide a mechanism to look up default qualitative assessment ratings (Low, Medium, High) for a given FSLI name across the 8 regulatory pillars.

#### Scenario: FSLI exists in library
- **WHEN** a lookup is performed for "Kas dan Setara Kas"
- **THEN** the system returns the mapped ratings for all 8 pillars defined in the library

#### Scenario: FSLI contains extra whitespace
- **WHEN** a lookup is performed for "  Aset Tetap  "
- **THEN** the system trims the input and returns the correct mapping for "Aset Tetap"

### Requirement: Default Fallback for Unmapped FSLIs
The system SHALL default all 8 pillars to "Low" if an FSLI name is not found in the assertions library.

#### Scenario: FSLI missing from library
- **WHEN** a lookup is performed for an unknown FSLI "Experimental Account"
- **THEN** the system returns "Low" for all 8 qualitative pillars
