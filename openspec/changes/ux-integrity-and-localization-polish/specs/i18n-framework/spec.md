## ADDED Requirements

### Requirement: i18n Translation Mechanism
The system SHALL provide a centralized mechanism for managing and switching between multiple languages (Indonesian and English) without requiring a page reload.

#### Scenario: Language switching
- **WHEN** the user selects "English" from the language switcher
- **THEN** the system SHALL update all UI text elements to their English equivalents immediately

### Requirement: Standardized Translation Keys
The system SHALL use standardized translation keys (e.g., `common:buttons.save`, `rcm:fields.riskRating`) across the entire frontend to ensure consistency.

#### Scenario: Consistent button labels
- **WHEN** the "Save" button is rendered in the Scoping page and the RCM Editor
- **THEN** both SHALL use the same `common:buttons.save` key to ensure identical labels
