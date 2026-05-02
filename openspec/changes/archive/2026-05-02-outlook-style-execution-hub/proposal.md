## Why

The current Todo List UI is a basic split-view that lacks the functionality and visual clarity needed for managing the complex ICOFR lifecycle. Moving to an Outlook-style "Execution Hub" provides a grid-first visual representation of compliance activities, enabling better scheduling, monitoring, and accountability for SOE (BUMN) compliance teams.

## What Changes

- **Layout Refactoring**: Pivot `TodoListPage.tsx` from a split-view to a full-width monthly grid with a functional toolbar and sidebar.
- **Enhanced Scheduling**: Add support for scheduling all mandatory ICOFR rituals including Review Scoping, RCM Updates, SOC Report Evaluations, and Investee Monitoring.
- **Configurable Reminders**: Implement a notification trigger system allowing reminders at configurable intervals (minutes, hours, days, months).
- **Severity Integration**: Link Remediasi activities with their severity (MW, SD, CD) using distinct visual accents (borders/icons).
- **Data Integrity**: Integrate the `UnSavedChanges` guard to prevent data loss in scheduling and reminder forms.
- **Notification Center**: Add a "Notification Bell" in the global header to display a list of pending tasks and reminders. Removed unused `UserNav` components.
- **Localization**: Full i18n localization support (ID/EN) for new scheduling types, time units, and severity levels.

## Capabilities

### New Capabilities
- `compliance-notification-system`: Ability to trigger, store, and display notifications for compliance deadlines and reminders.
- `icofr-ritual-scheduling`: Comprehensive scheduling capability for all mandatory activities as per Juknis SK-5/2024.

### Modified Capabilities
- `csa-management`: Requirements modified to support configurable reminders and grid-based visual status.
- `remediation-tracking`: Requirements modified to include severity-based visual cues and rescheduling with mandatory justification.

## Impact

- `src/pages/csa/TodoListPage.tsx`: Major UI refactor.
- `src/components/layout/AppLayout.tsx`: Integration of the Notification Bell.
- `worker/db/schema.ts`: Database migration for `notifications`, `reminders`, and `action_plans` enhancements.
- `src/i18n/locales/`: Addition of localization keys for new UI elements and severity levels.
- `src/hooks/useUnsavedChanges.ts`: Integration with new forms.
