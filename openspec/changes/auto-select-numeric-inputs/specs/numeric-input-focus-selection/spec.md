## Purpose

Provides automatic full-text selection upon focus for all numeric, currency, and monetary input elements across the platform, eliminating confusing typing artifacts such as leading zeros (e.g. typing 15 over 0 becoming 015).

## ADDED Requirements

### Requirement: Numeric Input Focus Auto-Selection
The input system SHALL automatically select the entire content of an input element when it receives focus, if the input is configured or recognized as numeric, currency, or decimal.

#### Scenario: User focuses on numeric input with value 0
- **WHEN** an input with `type="number"` and value `0` receives focus via mouse click or keyboard navigation
- **THEN** the entire text value `0` SHALL be selected/highlighted so subsequent keystrokes overwrite it immediately without producing leading zero artifacts

#### Scenario: User focuses on formatted currency or numeric string
- **WHEN** an input containing a numeric or currency pattern (e.g., `inputMode="numeric"`, `inputMode="decimal"`, or string matching currency formats) receives focus
- **THEN** the entire text SHALL be selected

#### Scenario: User focuses on non-numeric text input
- **WHEN** a standard text input (e.g., entity name, rationale text, search input) without `selectOnFocus` receives focus
- **THEN** the input SHALL NOT automatically select all text, preserving standard cursor placement behavior

#### Scenario: Explicit opt-in or opt-out via prop
- **WHEN** an input explicitly specifies `selectOnFocus={true}` or `selectOnFocus={false}`
- **THEN** the explicit property SHALL override default heuristic detection
