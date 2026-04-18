## ADDED Requirements

### Requirement: Role-Based Knowledge Injection
The AI Chat system SHALL dynamically inject relevant document text into the system prompt based on the user's role and department.

#### Scenario: Line 1 User query
- **WHEN** a Line 1 user from "Finance" asks a question
- **THEN** system SHALL query documents where (type = 'External') OR (type = 'Internal' AND department_id = 'Finance') and provide their content to the AI model

#### Scenario: Line 3 User query
- **WHEN** a Line 3 user asks a question
- **THEN** system SHALL include content from all documents regardless of department or type isolation

### Requirement: Account-Aware Context Retrieval
The system SHALL prioritize documents linked to specific GL Accounts or FSLIs if the user's query mentions those terms or if the user is currently on a page related to those items.

#### Scenario: Query about specific GL
- **WHEN** user asks "Bagaimana prosedur Kas?" and a document is linked to "GL: Kas"
- **THEN** system SHALL ensure that document is included in the top context provided to the AI
