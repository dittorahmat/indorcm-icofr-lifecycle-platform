## Context

The visual BPM editor has compliance-driven lock logic (`isLocked` state) which determines if a diagram is read-only. However, when a diagram is locked, the `RegulatoryPropertySheet` detail drawer still allows inputs and action items to be clicked/typed in. Because the save function is disabled under lock, the user's edits are lost upon closing, which triggers confusing unsaved changes warning dialogs. Additionally, diagram save mutation failures in `BPMEditor` do not output error toast feedback, causing silent failures.

## Goals / Non-Goals

**Goals:**
- Propagate the diagram's lock status (`isLocked`) into `RegulatoryPropertySheet` and its nested sub-forms (`TLCForm`, `ELCForm`, `ITGCForm`).
- Disable all text inputs, textareas, selects, switches, and buttons (like adding risk/control or removing nodes) when `isLocked` is true.
- Display a prominent read-only warning banner at the top of the sheet explaining that changes cannot be made due to the lock status.
- Implement proper error handling with user-facing toasts on diagram save mutation failures in `BPMEditor`.

**Non-Goals:**
- Modifying the underlying backend locking business rules.
- Implementing locks on non-BPM pages or worksheets.

## Decisions

### 1. Lock Propagation to Detail Drawer
Pass `isLocked` from `BPMEditor.tsx` to `RegulatoryPropertySheet` as a boolean prop. Ensure this prop is further passed down to the form sub-components: `TLCForm`, `ELCForm`, and `ITGCForm`. All inputs, select triggers, switches, and edit/add buttons inside these components will bind their `disabled` state to this prop.

### 2. Lock Warning Banner
Render a warning banner using standard UI alert design at the top of the scrollable property drawer when `isLocked` is true. The warning text will inform the user that the diagram is currently locked (read-only) due to the active workflow state, year lock, or period lock.

### 3. Add Save Mutation Error Feedback
Add an `onError` callback handler inside the `saveMutation` config in `BPMEditor.tsx` to catch errors and trigger `toast.error(t('common:notifications.error', { defaultValue: 'Failed to save diagram changes' }))`.

## Risks / Trade-offs

- **[Risk]** Nested form fields within sub-forms (like ITGC/ELC assertion checkboxes/selects) might escape the disabled state.
  - **[Mitigation]** Carefully inspect all forms inside `src/components/rcm/properties/` and verify that all inputs, textareas, selects, and checkboxes respect the passed `isLocked`/`disabled` prop.
