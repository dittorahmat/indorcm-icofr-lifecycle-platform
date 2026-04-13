## ADDED Requirements

### Requirement: Brand name replacement in all user-facing surfaces
The system SHALL display "ISB Risk Pro" wherever it previously displayed "IndoRCM Pro" or "Indo RCM Pro". All user-visible text, headers, footers, login screens, welcome pages, report outputs, and sidebar navigation SHALL reflect the new brand name.

#### Scenario: User sees new brand on login page
- **WHEN** user navigates to the login page
- **THEN** the application title displays "ISB Risk Pro" instead of "IndoRCM Pro"

#### Scenario: User sees new brand in main header
- **WHEN** user views the main application header after login
- **THEN** the header displays "ISB Risk Pro"

#### Scenario: User sees new brand in sidebar
- **WHEN** user opens the application sidebar
- **THEN** the sidebar branding shows "ISB Risk Pro"

#### Scenario: User sees new brand on welcome page
- **WHEN** user visits the welcome page
- **THEN** the heading reads "Selamat Datang di ISB Risk Pro"

#### Scenario: User sees new brand on home page
- **WHEN** user visits the home/dashboard page
- **THEN** all references to the old brand name are replaced with "ISB Risk Pro"

#### Scenario: Printed report shows new brand
- **WHEN** user generates or prints a report
- **THEN** the report footer displays "Verified by ISB Risk Pro" and "Dicetak otomatis oleh ISB Risk Pro v2.0"

#### Scenario: Regulatory appendix shows new brand
- **WHEN** user views regulatory compliance appendices
- **THEN** the compliance engine attribution reads "ISB Risk Pro Compliance Engine"
