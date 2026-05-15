## MODIFIED Requirements

### Requirement: LLM Tool Use Infrastructure
The system SHALL provide a backend infrastructure that allows the AI Chatbot to execute predefined functions (tools) to retrieve live application data AND perform approved write operations.

#### Scenario: AI requests data via tool
- **WHEN** a user asks a question requiring live data (e.g., "What are my tasks?")
- **THEN** the AI SHALL identify the appropriate tool and request its execution
- **AND** the backend SHALL execute the query and return the result to the AI

#### Scenario: AI requests write action
- **WHEN** the AI identifies an intent to modify system state
- **THEN** it SHALL request execution of a write-enabled tool
- **AND** the system SHALL require explicit user approval via a secure token before committing the change.
