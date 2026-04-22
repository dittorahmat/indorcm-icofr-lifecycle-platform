## Why

To comply with Regulation SK-5/2024, Risks and Controls must be identified through formal walkthroughs or derived from standardized industry libraries, not arbitrarily created during process mapping. Currently, the BPM Editor allows "manual typing" of risks, creating data silos. Additionally, as the database grows, the dropdown menus for linking existing risks/controls have become unwieldy without search capabilities.

## What Changes

- **Disable Manual Creation in BPM**: Remove the ability to "type-in" new risks/controls directly in the BPM Editor sidebar to enforce the use of standardized libraries.
- **Risk Library Integration**: Replace the manual risk input with the `RiskLibraryLookup` component in the BPM Editor.
- **Searchable Selects**: Implement search functionality in the Risk and Control selection dropdowns within the BPM Editor side panel.
- **Improved UX**: Streamline the "Linking" process to reduce friction while maintaining data integrity.

## Capabilities

### New Capabilities
- `searchable-bpm-linking`: Enhanced UI for linking and searching master data within the visual editor.

### Modified Capabilities
- `risk-library`: Extension of library usage into the BPM diagramming workflow.

## Impact

- **Frontend**: Significant updates to `src/components/rcm/BPMEditor.tsx`.
- **UX**: Shift from "Create-as-you-go" to "Link-from-Library" workflow.
