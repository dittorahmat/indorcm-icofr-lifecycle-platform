## Context

The current CSA Todo page uses a scheduling dialog that requires linking an activity to a BPM Process via a dropdown. However, users often need to schedule activities that don't directly map to a specific BPM process or prefer to use descriptive names. Furthermore, the Calendar grid view lacks the descriptive clarity found in the Sidebar Todo list because it displays the activity type (CSA/TOD/TOE) instead of the activity's actual title/description.

## Goals / Non-Goals

**Goals:**
- Enable free-text "Detail Activity" input in the scheduling dialog.
- Ensure the "Detail Activity" is displayed in both the Todo Sidebar and the Calendar Grid.
- Maintain consistency between the two views.

**Non-Goals:**
- This design does not include changes to the underlying database schema (the `CSASchedule` type already includes a `description` field in `shared/types.ts`).
- It does not include automated data migration for existing schedules (users can edit them manually if needed).

## Decisions

### 1. Replace Dropdown with Free-text Input
- **Decision**: Remove the `bpmProcessId` selection logic for new schedules and replace it with an input bound to the `description` field.
- **Rationale**: Provides maximum flexibility for users to name their activities.
- **Alternatives**: Keep both dropdown and free-text. *Rejected* to simplify the UI as per user request.

### 2. Update Calendar Grid Event Rendering
- **Decision**: Update `TodoListGrid.tsx` to prefer `event.description` over `event.type` in the event badge.
- **Rationale**: Ensures the specific activity name is visible at a glance on the calendar.

## Risks / Trade-offs

- **[Risk]** → Data inconsistency if old schedules lack a description.
- **Mitigation** → Fallback to `type` or "Activity" if description is empty.

- **[Risk]** → Long descriptions might break the layout.
- **Mitigation** → Use `truncate` and `Popover` (already in use) to handle overflow.
