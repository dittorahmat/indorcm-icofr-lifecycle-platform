## ADDED Requirements

### Requirement: Hierarchical Z-Index Management
The system SHALL establish a standardized z-index hierarchy for all interactive overlay elements to prevent layering conflicts (clipping or hiding).

#### Scenario: Dropdown Menu Visibility in Modals
- **WHEN** a user opens a `Select` dropdown menu inside a `Dialog` (Modal)
- **THEN** the dropdown menu MUST be rendered with a higher z-index than the Dialog content and overlay
- **AND** the dropdown menu MUST be fully visible and interactive to the user

### Requirement: Popover Layering Consistency
The system SHALL ensure that all `Popover` and `Command` based overlays follow the same hierarchical layering as `Select` menus.

#### Scenario: Combobox Visibility in Modals
- **WHEN** a user opens a Combobox (Command/Popover) inside a `Dialog`
- **THEN** the popover content MUST be rendered with a higher z-index than the Dialog content
- **AND** it MUST be fully visible and interactive

### Requirement: Clean Code and Refactor Hygiene
The system SHALL undergo a code hygiene audit to remove localized z-index hacks and ensure compliance with SOLID and DRY principles in UI components.

#### Scenario: Removal of Inline Z-Index Overrides
- **WHEN** the global z-index fix is applied
- **THEN** all inline `z-index` style overrides or `z-[...]` Tailwind classes that were previously used as workarounds MUST be removed or refactored to use the global theme tokens
- **AND** the application MUST pass all linting and type-checks
