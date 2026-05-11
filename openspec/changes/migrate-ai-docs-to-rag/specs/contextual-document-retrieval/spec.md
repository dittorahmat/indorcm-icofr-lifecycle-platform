## ADDED Requirements

### Requirement: Situational Chunk Prepending
The system SHALL prepend each text fragment with a situational summary (e.g., Document Title, Category, Year) before storing or indexing it.

#### Scenario: Retrieval with context
- **WHEN** a fragment about "risk assessment" is retrieved
- **THEN** the text passed to the LLM SHALL include its source metadata (e.g., "[Document: 2024 Energy Cluster Risk Library]") to prevent loss of context.
