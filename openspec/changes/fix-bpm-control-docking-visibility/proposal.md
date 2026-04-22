## Why

The BPM Editor fails to render control badges (green circles) upon creation due to a runtime crash in the data enrichment function and a race condition in the state update logic. Users expect immediate visual feedback when linking controls to risks.

## What Changes

- **Fix Runtime Crash**: Add null safety to `getEnrichedControlData` to prevent crashes while master data is loading.
- **Atomic State Updates**: Consolidate the two-step `setNodes` logic in `linkControlToRisk` into a single atomic update to eliminate race conditions.
- **Top Docking Consistency**: Lock the visual position of Risk and Control badges to the top of the Activity node (`y: -12`), honoring the current visual preference.

## Capabilities

### New Capabilities
- `bpm-editor-docking`: Reliable visual feedback for docked audit nodes.

### Modified Capabilities
- None

## Impact

- `src/components/rcm/BPMEditor.tsx`: Core logic for linking and visualizing risks/controls.
- BPM Diagrams: Improved reliability of badge rendering.
