## ADDED Requirements

### Requirement: RCM Matrix Context Awareness
RCM Matrix pages (ELC, TLC, ITGC) SHALL detect their rendering context (standalone vs. embedded) and adjust their layout accordingly.

#### Scenario: RCM Page in Standalone Mode
- **WHEN** the `embedded` prop is `false` or not provided
- **THEN** the page SHALL be wrapped in `AppLayout` to display the application sidebar and standard layout.

#### Scenario: RCM Page in Embedded Mode
- **WHEN** the `embedded` prop is `true`
- **THEN** the page SHALL NOT be wrapped in `AppLayout`
- **AND** it SHALL return the content directly to prevent layout nesting (like duplicate sidebars) in modals.
