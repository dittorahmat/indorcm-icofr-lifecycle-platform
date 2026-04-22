## ADDED Requirements

### Requirement: Persist TOD/TOE results
The system SHALL provide an API endpoint to persist Test of Design (TOD) and Test of Effectiveness (TOE) results into the database.

#### Scenario: Successful TOD submission
- **WHEN** a user submits the TOD form with all mandatory fields (method, evaluation attributes, comments)
- **THEN** the system SHALL save the record to the `test_records` table with the correct organization ID, control ID, and user ID.

#### Scenario: Successful TOE submission
- **WHEN** a user submits the TOE form with mandatory fields including sample size and homogeneity justification
- **THEN** the system SHALL save the record to the `test_records` table ensuring the homogeneity justification and sample size are persisted.

### Requirement: Capture SK-5 Evaluation Attributes
The system SHALL capture the mandatory evaluation attributes as defined in SK-5 Table 21 (Objective Achieved, Timing Accuracy, Authority & Competence, Info Reliability, Period Coverage, Evidence Availability).

#### Scenario: Record evaluation attributes
- **WHEN** a test record is saved
- **THEN** the `evaluation_attributes` JSON column in the database SHALL contain the boolean values for all 6 attributes.

### Requirement: User Profile Retrieval
The system SHALL provide a consistent API for retrieving the current user's profile information to support cooling-off validation.

#### Scenario: Fetch user profile
- **WHEN** the frontend requests the user profile
- **THEN** the system SHALL respond with the user's data including `processOwnershipHistory` to verify eligibility for testing a control.
