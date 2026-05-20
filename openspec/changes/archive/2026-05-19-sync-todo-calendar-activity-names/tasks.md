## 1. UI Refactoring

- [x] 1.1 Update `TodoListPage` state and form data to include `description` and handle free-text input.
- [x] 1.2 Replace "Sub Process" dropdown with "Detail Activity" Input field in the scheduling dialog.
- [x] 1.3 Update `handleEditClick` and `resetForm` to properly manage the new `description` field.

## 2. Calendar Consistency

- [x] 2.1 Modify `TodoListGrid` to display `event.description` in the event badges instead of `event.type`.
- [x] 2.2 Verify that the Sidebar Todo list correctly displays the custom description (already partially implemented but needs verification with new data).

## 3. Validation & Cleanup

- [x] 3.1 Verify end-to-end flow: Create a new activity with a custom name and confirm it appears identically in both Todo list and Calendar.
- [x] 3.2 Verify editing an existing activity updates the name in both views.
