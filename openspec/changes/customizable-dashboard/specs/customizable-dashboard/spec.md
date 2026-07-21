## ADDED Requirements

### Requirement: Customizable Dashboard Layout Workspace
The system SHALL provide an interactive dashboard layout where widgets can be dynamically rearranged, resized, and persisted in the database.

#### Scenario: Dragging and Rearranging Widgets
- **WHEN** the user drags a widget's header to another position in the grid
- **THEN** the system SHALL dynamically shift neighboring widgets to avoid overlapping and visually preview the new position

#### Scenario: Resizing Dashboard Widgets
- **WHEN** the user drags the resize handle of a widget
- **THEN** the system SHALL dynamically resize the widget up to its maximum width/height limits and adjust the grid layout

#### Scenario: Persistent Layout Syncing from Database
- **WHEN** the user loads the dashboard page
- **THEN** the system SHALL send a GET request to the database via API and load the customized widget positions and sizes associated with the authenticated user profile

#### Scenario: Debounced Layout Autosave to Database
- **WHEN** the user changes the widget layout position or size
- **THEN** the system SHALL debounce the state change and send a PUT request to update the layout configuration in the database, avoiding database traffic overloading

### Requirement: Widget Management Library
The system SHALL support adding and removing visualization widgets to and from the dashboard workspace, and resetting the layout to factory defaults.

#### Scenario: Adding a Widget to Dashboard
- **WHEN** the user selects a widget from the Widget Library sidebar catalog
- **THEN** the system SHALL append the new widget to the bottom of the grid layout with default dimensions

#### Scenario: Removing a Widget from Dashboard
- **WHEN** the user clicks the "Remove" or "Close" button on a widget's header
- **THEN** the system SHALL remove the widget from the active workspace, free up its grid slot, and sync the updated list with the database

#### Scenario: Resetting to Default Layout
- **WHEN** the user clicks the "Reset Layout" button
- **THEN** the system SHALL send a request to clear the saved layout in the database, load the factory default roles-based layouts, and refresh the dashboard workspace

### Requirement: Self-Service BI Widget Configurer
The system SHALL support configuring individual widget properties, including custom titles, metric data sources, and chart visualization styles.

#### Scenario: Editing Widget Data Source & Visualization Type
- **WHEN** the user clicks the "Settings" gear icon on any widget's header
- **THEN** the system SHALL open a configuration popover/dialog
- **AND WHEN** the user changes the widget's title, selects a new metric data source, or chooses a different chart visualization type (such as Bar Chart, Donut Chart, Heatmap Grid, or KPI Summary Cards)
- **THEN** the system SHALL dynamically re-render that specific widget to match the selected configuration and save the updated configuration state to the database.
