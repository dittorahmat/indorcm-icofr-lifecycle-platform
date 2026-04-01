## ADDED Requirements

### Requirement: Manual Override untuk Overall Materiality

Sistem SHALL allow user untuk manual adjust Overall Materiality setelah auto-calculation.

**UI Behavior:**
- Default: Calculated OM (read-only dengan edit icon)
- Click edit: Convert ke input field
- Manual adjustment: Show "Manual Override" badge
- Reset button: Kembali ke calculated value

#### Scenario: OM manual adjustment
- **WHEN** user clicks edit icon pada OM field
- **THEN** sistem convert display ke editable input field

#### Scenario: Manual override indicator
- **WHEN** user manually adjusts OM value
- **THEN** sistem show "Manual Override" badge next to OM field

#### Scenario: Reset to calculated
- **WHEN** user clicks "Reset to Calculated" button
- **THEN** sistem reset OM ke calculated value (Benchmark × Percentage)

### Requirement: Audit Trail untuk Manual Override

Sistem SHALL track manual OM adjustments untuk audit purposes.

**Audit Data:**
- Timestamp saat manual override
- Original calculated value
- Manual adjusted value
- User yang adjust (dari session)

#### Scenario: Manual override logging
- **WHEN** user manually adjusts OM
- **THEN** sistem log timestamp, original value, dan adjusted value
