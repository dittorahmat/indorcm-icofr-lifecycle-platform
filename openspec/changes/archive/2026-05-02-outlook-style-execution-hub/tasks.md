## 1. Database & Schema

- [x] 1.1 Add `reminder_config` (jsonb) column to `csa_schedules` table in `worker/db/schema.ts`
- [x] 1.2 Add `severity` and `reschedule_reason` columns to `action_plans` table in `worker/db/schema.ts`
- [x] 1.3 Create `notifications` table (id, userId, message, link, readStatus, createdAt) in `worker/db/schema.ts`
- [x] 1.4 Generate and run database migration: `npx drizzle-kit push`

## 2. Global Components

- [x] 2.1 Create `NotificationCenter` component with bell icon and unread badge
- [x] 2.2 Integrate `NotificationCenter` into `AppLayout.tsx` header
- [x] 2.3 Implement notification fetching logic using TanStack Query
- [x] 2.4 Clean up non-existent `UserNav` import to fix build process

## 3. Calendar UI Refactor

- [x] 3.1 Refactor `TodoListPage.tsx` to use a 7-column CSS Grid monthly layout
- [x] 3.2 Implement day cell with date label and list of activities
- [x] 3.3 Add Outlook-style toolbar (New Event, Navigation, View Switcher)
- [x] 3.4 Add Sidebar with mini-calendar and monthly task summary list

## 4. Scheduling & Reminders

- [x] 4.1 Update "Set Jadwal" dialog to support all ICOFR rituals
- [x] 4.2 Implement "Set Reminder" UI with value and unit dropdowns
- [x] 4.3 Add rescheduling popup with mandatory "Justification" field
- [x] 4.4 Integrate `useUnsavedChanges` guard into all scheduling forms

## 5. Activity Management (CRUD)

- [x] 5.1 Implement `ActivityDetailPopover` to show event summary on click
- [ ] 5.2 Integrate `ActivityDetailPopover` into Sidebar Todo List items
- [x] 5.3 Add "Edit" functionality to modify existing schedules (Update API)
- [x] 5.4 Add "Delete" functionality with confirmation dialog (Delete API)
- [ ] 5.5 Ensure proper audit log entry for every modification/deletion

## 6. Visual Styling & Localization

- [x] 6.1 Apply status-based backgrounds (Green/Red/Blue) to calendar events
- [x] 6.2 Apply severity-based border accents and icons to Remediasi activities
- [x] 6.3 Add new localization keys to `src/i18n/locales/` for time units and severity levels

## 7. Testing & Validation

- [x] 7.1 Verify grid cell overflow management (more than 3 events)
- [x] 7.2 Verify notification triggering for approaching deadlines
- [x] 7.3 Verify UnSavedChanges warning during form abandonment
- [ ] 7.4 Verify that deleting an activity correctly removes it from the calendar and DB
