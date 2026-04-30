## Why

The current BPM Editor uses non-standardized flowchart symbols and layout that do not fully comply with the **SK-5/DKU.MBU/11/2024** regulation (Lampiran 3 & 4). Specifically, the regulation requires processes to be mapped across functional divisions (Swimlanes) with clear "Department" and "Fungsi / Function" labels. Additionally, users have requested alignment with Microsoft Office (Visio/Word) standards and the ability to map Risks and Controls to any process step. To ensure data integrity, a double-layer "Unsaved Changes" warning system is required to prevent accidental navigation loss.

## What Changes

- **Standardized Regulatory Shapes**: Refactor and add new node types using SVG paths matching MS Office/Visio standards and SK-5 requirements (e.g., Inverted Triangle for Archive, Double-lined Rectangle for External Processes).
- **Functional Swimlanes (Lampiran 4)**: Implement a swimlane layout system allowing diagrams to be divided into vertical/horizontal columns with editable text boxes for **Department** and **Fungsi / Function**.
- **Universal Risk & Control Mapping**: Enable the "Risk/Control Badge" for all node types (Decisions, Documents, Systems, etc.), allowing auditors to flag risks at any stage.
- **Smart RCM ID Assignment**: Risks and Controls will only be assigned unique system IDs (R-xxx, C-xxx) when data is first entered in the Property Sheet, preventing "ID clutter" during initial drafting.
- **Formal Document UI Layer**: Add a configurable Header (Logo, Company Name, Metadata) and Footer (Approval/Sign-off block) to the canvas.
- **Print & Export Feature**: Implement functionality to export the diagram as a high-quality PDF/PNG, including the formal header/footer for regulatory submission.
- **Enhanced Toolbar**: Add missing Start and End terminal nodes to the editor palette.
- **Unsaved Changes Guard**: Implement internal and external navigation guards (React Router `useBlocker` and `beforeunload` listener) to warn users of unsaved edits.
- **Localization (i18n)**: Full localization support for all new BPM elements, swimlane labels, and warning messages in `src/i18n/`.
- **Database Schema Update**: Run Drizzle migrations to support any necessary schema changes for swimlane data, universal risk/control mapping, or BPM metadata.

## Capabilities

### New Capabilities
- `bpm-regulatory-shapes`: Standardized flowchart symbols per SK-5 and MS Office/Visio.
- `bpm-swimlanes`: Column-based functional division with Department/Function labels.
- `bpm-universal-rcm`: Ability to map Risks and Controls to any node type in the diagram.
- `bpm-smart-rcm-id`: On-demand ID generation for RCM entities during BPM editing.
- `bpm-formal-reporting`: Integrated Header/Footer UI with print/export functionality for regulatory compliance.
- `unsaved-changes-guard`: Detection and warning for unsaved changes during navigation.

### Modified Capabilities
- `bpm-edge-visuals`: Alignment of markers and connection styles with the new standardized shapes.

## Impact

- **Affected Components**: `BPMEditor.tsx`, `RegulatoryPropertySheet.tsx`, and shared node type definitions.
- **State Management**: Updated `BPMNode`, `BPMEdge`, and `BPMDiagram` structures to support swimlane groupings.
- **Database**: Drizzle schema updates and migrations.
- **UI/UX**: Change in the visual appearance of the editor to a more formal "Document" layout with swimlanes and navigation blockades.
- **Localization**: Updates to `src/i18n/locales/**/*.json`.
- **Dependencies**: Potential addition of `html-to-image` for export features.
