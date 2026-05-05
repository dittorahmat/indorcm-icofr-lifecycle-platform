## Context

The current `TodoListPage.tsx` uses a simple split-view layout. The goal is to refactor this into a high-fidelity "Execution Hub" that mimics Outlook's calendar, providing a monthly grid view where compliance activities (CSA, TOE, TOD, Remediasi) are visible directly in the date cells.

## Goals / Non-Goals

**Goals:**
- Implement a full-width monthly grid layout for `TodoListPage.tsx`.
- Create a reusable `NotificationCenter` component in the global header.
- Implement a database-backed reminder system with configurable intervals.
- Provide Full CRUD (Create, Read, Update, Delete) for calendar activities.
- Integrate `UnSavedChanges` warnings across all scheduling forms.
- Support visual differentiation of activities based on status and severity.

**Non-Goals:**
- Real-time notification pushing via WebSockets (fetch-on-navigation is sufficient).
- Custom non-ICOFR events (focus is strictly on regulatory rituals).

## Decisions

### 1. Data Model Enhancements
- **Decision**: Add `reminder_config` as a `jsonb` column to `csa_schedules` instead of a separate table.
- **Rationale**: Keeps the schema simpler for a 1:1 relationship while allowing flexible configuration (value/unit).
- **Alternative**: Separate `reminders` table. Rejected for overhead in querying/joining for this simple use case.

### 2. Layout Architecture
- **Decision**: Use a CSS Grid (7 columns) for the monthly view with `min-h` on cells to ensure events fit. Removed broken `UserNav` import from `AppLayout`.
- **Rationale**: Provides maximum control over cell sizing and event overflow management. `UserNav` was already handled by `MainHeader`.

### 3. Visual Accents for Severity
- **Decision**: Use "Triple Accent" (Background Status + Border Severity + Icon).
- **Rationale**: Avoids color collisions. Background shows completion status (Green/Red), Border/Icon shows Severity (Black/MW, Orange/SD).

### 4. Notification Hub Fetching & Localization
- **Decision**: Fetch notifications on `AppLayout` mount using TanStack Query, and fully localize all hardcoded text using `react-i18next`.
- **Rationale**: Simple to implement and fulfills the "refresh/navigation only" fetch requirement. i18n ensures SK-5 terminology is accurate in both EN and ID.

### 5. Activity Interaction Model (Edit/Delete)
- **Decision**: When a calendar item (in the grid or the sidebar list) is clicked, show an "Activity Detail Popover" instead of immediately opening the execution modal.
- **Rationale**: Provides a unified entry point for different actions (Execute, Edit, Delete) across all views. Prevents accidental execution and allows management of metadata.
- **UI Element**: Use Radix UI / Shadcn Popover for lightweight detail viewing and action selection.

## Risks / Trade-offs

- [Risk] Grid cell overflow if too many events on one day → [Mitigation] Limit display to 3 events + "+X more" popover.
- [Risk] Performance issues with large monthly grids → [Mitigation] Memoize day calculations and event filtering.
- [Risk] Missing notifications if user stays on one page → [Mitigation] TanStack Query `refetchInterval` set to 5 minutes.
