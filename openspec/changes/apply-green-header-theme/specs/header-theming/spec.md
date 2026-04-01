## ADDED Requirements

### Requirement: Light Mode Green Header
The system SHALL display the header with an Emerald 600 background color when in Light Mode.

#### Scenario: Light Mode Display
- **WHEN** the system theme is set to 'light'
- **THEN** the header background SHALL be Emerald 600 (`bg-emerald-600`) and text SHALL be white.

### Requirement: Dark Mode Green Header
The system SHALL display the header with an Emerald 950 background color when in Dark Mode.

#### Scenario: Dark Mode Display
- **WHEN** the system theme is set to 'dark'
- **THEN** the header background SHALL be Emerald 950 (`bg-[#022c22]`) and active text SHALL be Emerald 400.

### Requirement: Contrast and Legibility
The system SHALL ensure all interactive elements (links, buttons, avatars) in the header are legible against the green background.

#### Scenario: High Contrast Navigation
- **WHEN** the header is green
- **THEN** navigation links SHALL use high-contrast colors (white or light emerald) and change color/weight on hover.
