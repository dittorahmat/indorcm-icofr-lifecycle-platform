## Why

The current sidebar structure is organized by generic lifecycle stages (Implementation, Evaluation, etc.). The user wants to reorganize the sidebar to match a specific "Enterprise" grouping (MASTER, RCSA, TOD/TOE, etc.) as sketched in the provided `sidebar-sample.jpeg`. This will make the navigation more intuitive for the end-users who are accustomed to these specific groupings.

## What Changes

- **Sidebar Menu Reorganization**: Group existing and new navigation items into the following categories:
    - **MASTER**: Data sync, BPM selection, Scoping/Materiality.
    - **RCSA**: Risk identification, Control matrix, Self Assessment.
    - **TOD/TOE**: Test of Design and Test of Operating Effectiveness.
    - **Report**: Regulatory reports (Lampiran 1 to 11).
    - **AI**: AI-powered auditing tools.
    - **User**: User and role management.
- **Label Updates**: Rename several menu items to match the user's terminology (e.g., "CSA Workspace" -> "Self Assessment").
- **Visual Structure**: Update `app-sidebar.tsx` to use the new group labels and item order.

## Capabilities

### New Capabilities
- `reorganized-navigation`: Implementation of the new tiered navigation structure.

### Modified Capabilities
- None

## Impact

- `src/components/app-sidebar.tsx`: This is the only file affected by the structural change.
- `src/pages/`: Some pages might need internal tab navigation adjustments to match the "drilldown" feel if we separate consolidated views (e.g., separating RCM into Identification and Control).
