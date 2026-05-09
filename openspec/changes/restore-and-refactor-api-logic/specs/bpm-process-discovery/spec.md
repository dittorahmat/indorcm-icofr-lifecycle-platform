## ADDED Requirements

### Requirement: BPM Diagram Discovery
The system MUST allow discovery of BPM diagrams by associated GL account or specific subprocess name.

#### Scenario: Diagram discovery by GL
- **WHEN** user requests a diagram for a given GL account
- **THEN** system returns the diagram associated with the process linked to that GL

#### Scenario: Diagram discovery by subprocess
- **WHEN** user requests a diagram with a subprocess name query
- **THEN** system returns the diagram matching that subprocess name
