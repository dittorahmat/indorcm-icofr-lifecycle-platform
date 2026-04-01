## ADDED Requirements

### Requirement: Deficiency State Transitions based on Verification
Deficiencies SHALL only be marked as "Verified" (Final state) after the associated Action Plan has been "Resolved" and then "Verified" by the Internal Audit (Lini 3).

#### Scenario: Final verification of deficiency
- **WHEN** a Lini 3 user marks an action plan as "Verified"
- **THEN** the parent Deficiency status SHALL automatically update to "Verified"
