## ADDED Requirements

### Requirement: Centralized Risk Storage
The system SHALL store standardized risks in a centralized repository, categorized by BUMN Industry Clusters as per SK-5/2024 Appendix 2.

#### Scenario: Verify risk storage structure
- **WHEN** a risk is saved to the library
- **THEN** it MUST include a cluster identifier, description, and suggested assertions

### Requirement: Risk Library CRUD Interface
The system SHALL provide a dedicated user interface for Admin and Line 2 users to create, read, update, and delete risks in the centralized library.

#### Scenario: Admin adds a new standardized risk
- **WHEN** Admin fills the "Add Risk" form with cluster and description and clicks "Save"
- **THEN** the new risk SHALL appear in the Risk Library list

### Requirement: Search and Filter by Cluster
The system SHALL allow users to filter the Risk Library by industry cluster and search by keywords within the risk description.

#### Scenario: User filters risks by Energy Cluster
- **WHEN** User selects "Industri Energi" from the cluster filter
- **THEN** only risks belonging to the Energy cluster SHALL be displayed
