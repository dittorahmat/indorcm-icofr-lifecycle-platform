## ADDED Requirements

### Requirement: WBS Indicator Analysis
The AI SHALL be able to retrieve and analyze indicators from the Whistleblowing Recap to identify potential fraud risks in ICOFR processes.

#### Scenario: Correlating WBS with BPM risks
- **WHEN** user asks "Are there any recent WBS indicators related to the Payroll process?"
- **THEN** the AI SHALL query the `wbs` recap data for the "Payroll" department
- **AND** compare results with existing risk descriptions in the RCM.
