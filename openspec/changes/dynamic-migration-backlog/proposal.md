## Why

The current BPM Editor features a hardcoded "Migration Backlog" section. Users who upload RCM data via CSV currently have to manually create activity nodes and map risks/controls one-by-one through the properties panel, which is incredibly tedious for large datasets. This change replaces the hardcoded placeholders with actual unmapped RCM data and enables a drag-and-drop workflow to instantly instantiate linked BPM nodes, dramatically accelerating the process modeling phase.

## What Changes

- Replace the hardcoded Migration Backlog in `BPMEditor` with a dynamic list of unmapped risks and controls for the current process and year.
- Implement HTML5 Drag-and-Drop capability for items in the Migration Backlog.
- Add an `onDrop` handler to the React Flow canvas to automatically generate a new `Activity` node pre-populated with the dropped RCM data.
- Automatically filter out items from the backlog once they have been mapped onto the canvas.

## Capabilities

### New Capabilities
- `drag-drop-rcm-mapping`: The ability to drag unmapped RCM items from a backlog and drop them onto the BPM canvas to create linked activity nodes.

### Modified Capabilities

## Impact

- **Frontend**: `src/components/rcm/BPMEditor.tsx` (major updates for data fetching, drag-and-drop handlers, and state management).
- **React Flow Integration**: New node instantiation logic upon drop events.
