## ADDED Requirements

### Requirement: LLM Tool Use Infrastructure
The system SHALL provide a backend infrastructure that allows the AI Chatbot to execute predefined functions (tools) to retrieve live application data.

#### Scenario: AI requests data via tool
- **WHEN** a user asks a question requiring live data (e.g., "What are my tasks?")
- **THEN** the AI SHALL identify the appropriate tool and request its execution
- **AND** the backend SHALL execute the query and return the result to the AI

### Requirement: User Context Injection
The system SHALL inject user-specific metadata (Role, Department, Current Date) into every AI chat request to ensure temporal and situational awareness.

#### Scenario: AI aware of current date
- **WHEN** a user asks about "deadline next month"
- **THEN** the AI SHALL use the injected current date to correctly calculate and query for the relevant timeframe

### Requirement: Strict RBAC for AI Tools
The system SHALL enforce the same access controls for AI tool execution as it does for the standard UI.

#### Scenario: unauthorized data access attempt
- **WHEN** a Lini 1 user asks for data belonging to another department via AI
- **THEN** the AI tool execution SHALL automatically filter results to only include data accessible to the user
- **AND** the AI SHALL inform the user if no data is found within their permissions
