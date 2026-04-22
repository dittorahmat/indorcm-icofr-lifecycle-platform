## 1. UI Refactor - Searchable Selects

- [x] 1.1 Implement a local search filter for the Risk selection list in the `BPMEditor` sidebar.
- [x] 1.2 Implement a local search filter for the Control selection list in the `BPMEditor` sidebar.
- [x] 1.3 Replace generic icons with cluster-specific identifiers if available.

## 2. Risk Library Integration

- [x] 2.1 Import `RiskLibraryLookup` into `src/components/rcm/BPMEditor.tsx`.
- [x] 2.2 Disable the "prompt manual typing" for new risks and replace with the `RiskLibraryLookup` component.
- [x] 2.3 Ensure selecting a risk from the library correctly triggers the `createRiskMutation` with the standardized data.

## 3. Control Integration

- [x] 3.1 Disable the "prompt manual typing" for new controls in the BPM Sidebar.
- [x] 3.2 Add a "Master Data Lookup" link for controls to encourage reuse of existing RCM entries.

## 4. Verification

- [x] 4.1 Verify that users can no longer enter arbitrary risk descriptions in the BPM Editor.
- [x] 4.2 Verify that the search bar correctly filters 20+ items in the dropdown lists.
- [x] 4.3 Verify the end-to-end flow from Risk Library selection to visual diagram update.
