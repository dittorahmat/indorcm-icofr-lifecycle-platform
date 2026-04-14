## ADDED Requirements

### Requirement: All UI labels and headings SHALL be in English
All user-facing labels, headings, section titles, and display text in the application interface SHALL be presented in English. Indonesian text SHALL be replaced with contextually appropriate English equivalents.

#### Scenario: Navigation menu displays in English
- **WHEN** user views the navigation menu or sidebar
- **THEN** all menu items, sub-menus, and labels are displayed in English

#### Scenario: Page headings display in English
- **WHEN** user navigates to any page or view
- **THEN** the page title, section headings, and sub-headings are displayed in English

#### Scenario: Dashboard widgets display in English
- **WHEN** user views the dashboard
- **THEN** all widget titles, labels, and summary text are displayed in English

### Requirement: All button text SHALL be in English
All interactive button and action item text SHALL be presented in English.

#### Scenario: Primary action buttons display in English
- **WHEN** user views any page with action buttons
- **THEN** all button labels (e.g., Save, Cancel, Delete, Edit, Create) are in English

#### Scenario: Icon-only buttons have English tooltips
- **WHEN** user hovers over icon-only buttons
- **THEN** the tooltip text describing the action is in English

### Requirement: All form elements SHALL use English labels and messages
Form field labels, placeholders, validation messages, and helper text SHALL be in English.

#### Scenario: Form field labels are in English
- **WHEN** user views any form
- **THEN** all field labels, section labels, and group labels are in English

#### Scenario: Form placeholders are in English
- **WHEN** user focuses on an empty form field
- **THEN** any placeholder text hint is in English

#### Scenario: Validation messages are in English
- **WHEN** user submits a form with invalid data
- **THEN** all error messages indicating what is wrong are in English

### Requirement: All table and data display elements SHALL use English headers and labels
Table column headers, row labels, filter names, pagination text, and data summary text SHALL be in English.

#### Scenario: Table column headers are in English
- **WHEN** user views any data table
- **THEN** all column headers and sort indicators are in English

#### Scenario: Pagination and summary text is in English
- **WHEN** user views paginated data
- **THEN** pagination controls, item counts, and summary text are in English

### Requirement: All modal and dialog elements SHALL use English titles and content
Modal window titles, body content, action buttons, and close text SHALL be in English.

#### Scenario: Modal dialogs display in English
- **WHEN** a modal or dialog window opens
- **THEN** the title, body content, and action buttons are all in English

### Requirement: All notification and status messages SHALL be in English
Success messages, error messages, warning messages, and informational toasts SHALL be in English.

#### Scenario: Success notifications are in English
- **WHEN** an operation completes successfully
- **THEN** the success message displayed is in English

#### Scenario: Error notifications are in English
- **WHEN** an operation fails or encounters an error
- **THEN** the error message displayed is in English

### Requirement: All settings and configuration page labels SHALL be in English
Settings page titles, section labels, option labels, and save/cancel text SHALL be in English.

#### Scenario: Settings pages display in English
- **WHEN** user navigates to any settings or configuration page
- **THEN** all labels, section headers, and option descriptions are in English

### Requirement: All report and export labels SHALL be in English
Report titles, section headers, column names in exports, and download labels SHALL be in English.

#### Scenario: Reports display in English
- **WHEN** user views or exports reports
- **THEN** all titles, headers, and column labels are in English

### Requirement: Database schema comments SHALL be in English
All Drizzle ORM schema comments, column descriptions, and table descriptions SHALL be in English.

#### Scenario: Schema documentation is in English
- **WHEN** a developer reads the schema file comments
- **THEN** all column and table descriptions are in English

### Requirement: Documentation headings SHALL be in English
All markdown documentation file headings, section titles, and navigation references SHALL be in English.

#### Scenario: Documentation files use English headings
- **WHEN** a reader views any documentation markdown file
- **THEN** all headings, section titles, and table of contents entries are in English

### Requirement: Terminology consistency SHALL be maintained across the application
The same concept SHALL always use the same English term. Translations SHALL follow standard enterprise/SaaS terminology conventions.

#### Scenario: Consistent term usage across different pages
- **WHEN** the same concept appears on multiple pages (e.g., "Reports", "Settings", "Dashboard")
- **THEN** the exact same English term is used everywhere

#### Scenario: Domain-specific terms follow standard conventions
- **WHEN** domain-specific terms appear (financial, lifecycle management)
- **THEN** they use standard industry English terminology
