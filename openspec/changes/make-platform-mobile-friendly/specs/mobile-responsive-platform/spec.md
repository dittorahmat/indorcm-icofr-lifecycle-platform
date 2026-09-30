## Purpose

Defines comprehensive mobile-first and responsive UX patterns across the IndoGRC Pro platform, ensuring that complex governance, risk, and control datasets can be effectively operated, reviewed, and approved on mobile smartphones and small tablets without data truncation or disruptive horizontal panning.

## ADDED Requirements

### Requirement: Responsive Table to Vertical Card Transformation
The system SHALL dynamically transform wide data matrices (including RCM TLC, ELC, and ITGC views) from horizontal tables into stacked vertical card lists when the viewport width is below 768px (Tailwind `md` breakpoint).

#### Scenario: Viewing RCM matrix on a mobile screen
- **WHEN** user accesses the RCM matrix page on a viewport narrower than 768px
- **THEN** the system SHALL hide the wide horizontal multi-column table
- **AND** the system SHALL display each control record as a structured vertical card showing key regulatory identifiers (Control Code, Business Process, Risk Description, Control Nature, and Effectiveness Status)
- **AND** tapping on a card SHALL trigger an expanded view or drawer containing the full set of compliance attributes

#### Scenario: Viewing RCM matrix on a desktop screen
- **WHEN** user accesses the RCM matrix page on a viewport of 768px or wider
- **THEN** the system SHALL render the standard multi-column frozen-header data table

### Requirement: Floating AI Assistant Collision Avoidance
The system SHALL offset floating overlays, specifically the AI Chatbot FAB button (`AIFabButton`), on mobile screens such that it does not overlap with the bottom navigation bar (`MobileBottomNav`) or safe area insets.

#### Scenario: Mobile viewport AI button placement
- **WHEN** the application renders on a mobile viewport (< 768px) with `MobileBottomNav` present
- **THEN** `AIFabButton` SHALL be positioned above the bottom bar with safe clearance (`bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))]`)
- **AND** the FAB button SHALL NOT intercept touches intended for bottom navigation items

### Requirement: Institutional Mobile Touch Ergonomics and Anti-Slop
The system SHALL enforce enterprise touch usability across all mobile interfaces, maintaining minimum 44x44px touch targets, minimum 12px readable fonts (`text-xs` / `text-sm`), non-italic regulatory indicators, and solid background surfaces without glassmorphism.

#### Scenario: Interacting with buttons and inputs on mobile
- **WHEN** user taps any interactive navigation link, button, badge toggle, or table action on mobile
- **THEN** the target element SHALL have a minimum tap area of 44x44px
- **AND** all typography SHALL meet or exceed 12px with high-contrast text tokens
