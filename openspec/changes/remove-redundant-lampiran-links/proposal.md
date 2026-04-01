## Why

Currently, the sidebar displays 11 Lampiran links (Lampiran 1-11), all pointing to the same `/reports` page with identical content. This creates unnecessary visual clutter and confusion for users, as clicking any Lampiran link produces the same result.

## What Changes

- **Remove Redundant Links**: Remove Lampiran 1 through Lampiran 10 from the sidebar navigation
- **Keep Single Link**: Retain only Lampiran 11 as the definitive report link
- **Clean Navigation**: Simplify the Report section to show only unique, meaningful report links

## Capabilities

### New Capabilities

- None (this is a UI cleanup change, no new capabilities)

### Modified Capabilities

- None (no requirement changes, only UI simplification)

## Impact

- `src/components/app-sidebar.tsx`: Removal of the Array.map loop generating 11 Lampiran links, replaced with a single Lampiran 11 link
