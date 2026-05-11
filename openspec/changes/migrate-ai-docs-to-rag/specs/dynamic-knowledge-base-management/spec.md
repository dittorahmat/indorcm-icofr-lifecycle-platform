## MODIFIED Requirements

### Requirement: Dynamic Document Upload
The system SHALL support dynamic document upload with automatic embedding generation and indexing.

#### Scenario: Uploading a document
- **WHEN** a user uploads a new document
- **THEN** the system SHALL store the file in R2
- **AND** it SHALL extract text from the document
- **AND** it SHALL generate a vector embedding for the extracted text
- **AND** it SHALL save both the text and the embedding in the PostgreSQL database.
