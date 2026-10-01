## MODIFIED Requirements

### Requirement: Reliable Kanban Drag Activation and Feedback
The system SHALL start a card drag from the card header on pointer grab, render the dragged card in a drag overlay that follows the pointer, highlight the visible target column during cross-column hover, and register each droppable/sortable identity exactly once per viewport.

#### Scenario: Grab starts drag
- **WHEN** an authorized user presses and moves the pointer on a deficiency card header (desktop)
- **THEN** the drag SHALL activate, the card SHALL lift into a drag overlay following the pointer, and the hovered column SHALL show its active drop highlight

#### Scenario: Single identity registration per viewport
- **WHEN** the board renders at desktop width
- **THEN** exactly 4 column droppables SHALL be registered (one per SK-5 status), and each action-plan card id SHALL be registered exactly once
- **WHEN** the board renders below the `md` breakpoint
- **THEN** only the mobile status-stream tree SHALL be mounted (the desktop tree unmounted, not merely hidden)

#### Scenario: Failed transition rolls back
- **WHEN** a drag-committed workflow transition fails on the server
- **THEN** the card SHALL return to its origin column and the board SHALL refetch authoritative `actionplans` state, with an error toast shown
