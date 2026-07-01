## ADDED Requirements

### Requirement: Chatbot Grounding and Scope Limitation
The AI Chatbot system SHALL strictly constrain its responses to information from the provided KNOWLEDGE BASE (uploaded PDF documents) and the IndoGRC Pro application's functional domain (regulation SK-5, scoping, testing, deficiencies, remediation). If a user queries topics outside this scope, the system SHALL refuse to answer and politely explain its limitations.

#### Scenario: Off-topic query rejection
- **WHEN** a user asks an off-topic question unrelated to the uploaded documents or IndoGRC Pro (e.g., "pedoman cuti karyawan")
- **THEN** the AI chatbot SHALL refuse to answer and state that it is only authorized to assist with uploaded regulations/procedures and IndoGRC Pro features.
