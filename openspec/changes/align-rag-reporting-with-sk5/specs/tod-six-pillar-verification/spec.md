## ADDED Requirements

### Requirement: 6-Pillar Verification Form
The Test of Design (TOD) form MUST include 6 specific verification pillars: Objective Achievement, Timing/Frequency, Authority & Competence, Information Reliability, Period Coverage, and Evidence Availability.

#### Scenario: User fills TOD form
- **WHEN** user selects TOD test type
- **THEN** the 6 regulatory pillars are displayed with detailed pass/fail criteria and comments

### Requirement: TOD Conclusion Guard
The system SHALL require all 6 pillars to be addressed before a final "Effective" conclusion can be submitted for a TOD test.

#### Scenario: Incomplete TOD submission
- **WHEN** user attempts to submit TOD with missing pillar evaluations
- **THEN** the system prevents submission and highlights the missing fields
