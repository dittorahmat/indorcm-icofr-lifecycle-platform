## MODIFIED Requirements

### Requirement: Unified Typography and Boolean Representation Across RCM Tables
All Risk Control Matrix tables (including TLC, ITGC, ELC, and Verification Design) SHALL use consistent font sizes, badge color palettes, and text-based `Y` / `N` indicators for boolean attributes.

#### Scenario: Rendering boolean attributes in RCM tables
- **WHEN** an RCM table renders boolean cells (such as Key Control, Fraud Indicator, IPO attributes, Assertion flags, or COSO principles)
- **THEN** it MUST render text `Y` for true values and text `N` for false or missing values, avoiding graphical icons or mixed character codes.

#### Scenario: Rendering Control Reference codes
- **WHEN** an RCM table displays a Control Reference code
- **THEN** it MUST render with `text-xs font-mono font-normal text-slate-600` styling.
