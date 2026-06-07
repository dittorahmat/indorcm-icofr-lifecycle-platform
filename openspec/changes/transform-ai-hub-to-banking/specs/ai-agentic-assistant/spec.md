## MODIFIED Requirements

### Requirement: User Context Injection
The system SHALL inject user-specific metadata (Role, Department, Current Date, and Organization Industry Cluster) into every AI chat request to ensure temporal, situational, and domain awareness.

#### Scenario: AI aware of banking context
- **WHEN** a user in a Banking organization asks "What are the common risks here?"
- **THEN** the AI SHALL use the injected "Banking" cluster context to prioritize banking-specific risks (e.g., Credit Risk, Liquidity Risk) in its response.

#### Scenario: AI aware of current date
- **WHEN** a user asks about "deadline next month"
- **THEN** the AI SHALL use the injected current date to correctly calculate and query for the relevant timeframe
