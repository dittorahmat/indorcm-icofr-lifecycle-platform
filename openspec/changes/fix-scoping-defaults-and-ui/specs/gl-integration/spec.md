## ADDED Requirements

### Requirement: Clean Benchmark Selection UI
The benchmark selection dropdown in `SmartImportWizard` SHALL omit internal sequence number badges (`#minNoUrut`) from candidate list items.

#### Scenario: User opens benchmark basis selector
- **WHEN** user opens the FSLI benchmark dropdown in SmartImportWizard
- **THEN** dropdown items show only the FSLI name and total balance value without `#` sequence badges
