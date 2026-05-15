## ADDED Requirements

### Requirement: Automatic Documentation Sync
The system SHALL provide a mechanism to synchronize the content of `USAGE_GUIDE.md` with the AI Knowledge Base during the build process.

#### Scenario: Sync on content change
- **WHEN** the content of `USAGE_GUIDE.md` is modified
- **AND** the build process is executed
- **THEN** the system SHALL detect the change via content hash
- **AND** replace existing AI chunks with new embeddings from the updated guide

#### Scenario: Skip sync if no change
- **WHEN** the build process is executed and `USAGE_GUIDE.md` hash matches the stored hash
- **THEN** the system SHALL skip the embedding generation and database update

### Requirement: Product Specialist Persona
The AI Assistant SHALL be instructed to use the synchronized `USAGE_GUIDE.md` content to answer questions regarding application usage and features.

#### Scenario: Answering how-to questions
- **WHEN** a user asks "How do I create a new BPM process?"
- **THEN** the AI Assistant SHALL retrieve the relevant section from the indexed usage guide
- **AND** provide a step-by-step answer based on the guide
