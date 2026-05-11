## ADDED Requirements

### Requirement: Modular Component Architecture
The system SHALL decompose pages exceeding 20KB or 500 lines into a container/presentational pattern or feature-based sub-components.

#### Scenario: Decomposing BPMPage
- **WHEN** the `BPMPage` is refactored
- **THEN** it SHALL be split into at least three sub-components (e.g., `BPMHeader`, `BPMGrid`, `BPMAccountAssertion`) to reduce individual file complexity.

### Requirement: Encapsulated Data Fetching
The system SHALL move all `useQuery` and `useMutation` calls from page components into domain-specific hooks.

#### Scenario: Using useBpmDiagrams hook
- **WHEN** a page needs to fetch BPM diagrams
- **THEN** it SHALL use the `useBpmDiagrams` hook instead of calling `useQuery` directly with `api-client`.

### Requirement: Service Layer Granularity
The system SHALL ensure that Service Layer methods in the backend do not exceed 50 lines of code and maintain Single Responsibility.

#### Scenario: Splitting updateDiagram in BpmService
- **WHEN** the `updateDiagram` method is refactored
- **THEN** it SHALL delegate risk and control synchronization to private methods to ensure the main method remains orchestrational.
