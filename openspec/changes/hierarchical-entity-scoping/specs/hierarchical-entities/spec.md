## ADDED Requirements

### Requirement: Business Entity Management
The system SHALL provide a mechanism to manage business entities with parent-child relationships, allowing for an infinite hierarchy level (e.g., Holding -> Sub-holding -> Subsidiary -> Branch).

#### Scenario: Creating a child entity
- **WHEN** a user creates a new business entity and specifies a Parent ID
- **THEN** the system SHALL establish a parent-child relationship between the two entities

### Requirement: Hierarchical CSV Upload
The system SHALL support CSV/Excel uploads that include a `Parent_Entity` column to define the organizational hierarchy during data import.

#### Scenario: Uploading hierarchical entity data
- **WHEN** a user uploads a CSV file containing an entity 'Branch A' with 'Subsidiary X' as its `Parent_Entity`
- **THEN** the system SHALL automatically create or link 'Branch A' as a child of 'Subsidiary X' in the business entity registry
