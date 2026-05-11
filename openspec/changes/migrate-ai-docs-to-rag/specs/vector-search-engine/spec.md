## ADDED Requirements

### Requirement: Semantic Similarity Search
The system SHALL provide a way to retrieve document fragments based on their semantic meaning using vector embeddings.

#### Scenario: Retrieval of relevant ICOFR fragments
- **WHEN** a user asks a question about "materiality calculation"
- **THEN** the system SHALL perform a vector search against the document library
- **AND** it SHALL return the top-K fragments that are mathematically closest to the query embedding.

### Requirement: Keyword-Vector Hybrid Ranking
The system SHALL combine results from semantic search and full-text keyword search using Reciprocal Rank Fusion (RRF) to ensure both context and technical terms are prioritized.

#### Scenario: Finding a specific regulation number
- **WHEN** a user searches for "SK-5/2024"
- **THEN** the system SHALL use keyword search to find the exact match
- **AND** it SHALL use vector search to find related context
- **AND** it SHALL return the exact match at the top of the list.

### Requirement: Automated Embedding Generation
The system SHALL automatically generate vector embeddings for every new document uploaded to the platform.

#### Scenario: Uploading a new PDF
- **WHEN** a user uploads a new ICOFR policy document
- **THEN** the system SHALL extract the text
- **AND** it SHALL call the embedding model to generate a vector
- **AND** it SHALL store the vector in the database alongside the text.
