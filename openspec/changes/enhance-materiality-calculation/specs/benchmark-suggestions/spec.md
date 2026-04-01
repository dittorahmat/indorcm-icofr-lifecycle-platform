## ADDED Requirements

### Requirement: Smart Benchmark Suggestions

Sistem SHALL provide smart suggestions untuk benchmark value berdasarkan GL data composition.

**Suggestion Logic:**
- Show breakdown per benchmark category
- Highlight most common benchmark (Pre-Tax Income)
- Show confidence level berdasarkan data quality

#### Scenario: Benchmark breakdown display
- **WHEN** GL data diupload
- **THEN** sistem show breakdown: Pre-Tax Income, Revenue, Assets, Equity values

#### Scenario: Confidence indicator
- **WHEN** GL data memiliki FSLI codes lengkap
- **THEN** sistem show "High Confidence" indicator

#### Scenario: Data quality warning
- **WHEN** GL data tidak memiliki FSLI codes
- **THEN** sistem show warning "Using account name matching - verify accuracy"
