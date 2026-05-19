## Why

The current BPM Editor requires users to open a property sheet to edit swimlane details (Department and Function), which slows down the process mapping workflow. While inline inputs were partially added to the `SwimlaneNode`, they are currently non-functional for existing diagrams because the necessary event handlers are not injected upon loading. This change aims to provide a fast, "gas pol" inline editing experience that matches the productivity expectations of power users.

## What Changes

- **Functional Inline Editing**: Inject `onChangeDepartment` and `onChangeFunction` handlers into swimlane nodes when loading diagrams from the database.
- **Improved Visual Feedback**: Enhance the `SwimlaneNode` UI to clearly indicate that Department and Function fields are editable, with better focus and hover states.
- **Dirty State Integration**: Ensure that changes made via inline inputs correctly trigger the unsaved changes warning (isDirty state).
- **Auto-Sync to RCM**: Ensure that department/function changes in swimlanes are correctly captured when saving the diagram to the backend.

## Capabilities

### New Capabilities
- `inline-swimlane-editing`: Enables direct editing of Department and Function labels on Swimlane nodes within the BPM canvas, ensuring full data persistence and UX parity with other editing methods.

### Modified Capabilities
<!-- None -->

## Impact

- `src/components/rcm/BPMEditor.tsx`: Node initialization and state management logic.
- `src/components/rcm/nodes/BPMCustomNodes.tsx`: `SwimlaneNode` component UI and interaction logic.
- `src/i18n/locales/**/bpm.json`: Placeholders and labels for swimlane editing.
