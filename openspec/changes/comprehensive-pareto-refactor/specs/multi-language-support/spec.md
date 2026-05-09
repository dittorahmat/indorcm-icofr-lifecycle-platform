## ADDED Requirements

### Requirement: Application Internationalization
The system SHALL support multiple languages, starting with English and Bahasa Indonesia, to comply with regional BUMN standards.

#### Scenario: User changes language
- **WHEN** the user selects "Bahasa Indonesia" from the language switcher
- **THEN** all UI labels, navigation items, and system messages SHALL be translated immediately

### Requirement: Regional Formatting
The system SHALL format numbers, dates, and currencies according to the selected locale's conventions.

#### Scenario: Currency formatting in ID locale
- **WHEN** the user is in the ID locale and views a balance
- **THEN** the amount SHALL be displayed with the "Rp" prefix and use dot as thousands separator
