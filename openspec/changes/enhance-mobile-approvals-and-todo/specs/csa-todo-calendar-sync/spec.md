## ADDED Requirements

### Requirement: Adaptive Mobile Agenda View
The system SHALL display an Agenda / Task Feed mode on viewports under 768px in place of the rigid 7-column calendar grid to eliminate clipped elements and horizontal compression.

#### Scenario: Mobile viewport renders Todo List
- **WHEN** the user navigates to the Todo List page on a viewport width below 768px
- **THEN** the system renders a vertical task agenda list grouped by date (Today, Overdue, Upcoming) instead of the 7-column monthly grid
- **WHEN** the user taps an agenda item
- **THEN** the item details and associated workflow or review actions are opened directly
