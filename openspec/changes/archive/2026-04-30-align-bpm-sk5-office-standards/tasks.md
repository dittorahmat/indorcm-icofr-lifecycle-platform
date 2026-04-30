## 1. Database & Schema

- [x] 1.1 Update Drizzle schema in `worker/db/schema.ts` to support swimlane metadata and universal RCM mapping
- [x] 1.2 Generate migration using `npx drizzle-kit generate`
- [x] 1.3 Run migration using `npx drizzle-kit push` (or migrate script)

## 2. Localization (i18n)

- [x] 2.1 Update `src/i18n/locales/en/bpm.json` with standardized SK-5 terminology and swimlane labels
- [x] 2.2 Update `src/i18n/locales/id/bpm.json` with standardized SK-5 terminology and swimlane labels
- [x] 2.3 Add `unsavedChanges` keys to `common.json` in both locales

## 3. Custom Node Shapes (SVG)

- [x] 3.1 Refactor `ArchiveNode` to use SVG Inverted Triangle (Lampiran 3)
- [x] 3.2 Implement `ManualInputNode` with slanted top SVG path (MS Office Standard)
- [x] 3.3 Implement `ExternalProcessNode` with double-lined border
- [x] 3.4 Implement `OffPageReferenceNode` with pentagon/chevron SVG path
- [x] 3.5 Refactor `SystemNode` to use rectangle (Blue) and Cylinder only for Media
- [x] 3.6 Register new node types in `BPMEditor.tsx` `nodeTypes` mapping

## 4. Swimlanes (Lampiran 4)

- [x] 4.1 Implement `SwimlaneNode` component with editable "Department" and "Function" labels
- [x] 4.2 Update `BPMEditor` logic to handle node-to-lane containment (ParentNode)
- [x] 4.3 Add "Add Swimlane" button to the Panel toolbar
- [x] 4.4 Implement auto-snapping or alignment of nodes within lanes

## 5. Universal RCM & Smart ID Assignment

- [x] 5.1 Refactor `DockedRiskNode` and `DockedControlNode` for universal attachment to any node type
- [x] 5.2 Update `RegulatoryPropertySheet.tsx` to allow RCM identification on any node type
- [x] 5.3 Implement "Generate ID on first input" logic in `RegulatoryPropertySheet`
- [x] 5.4 Update `BPMEditor` toolbar to include missing Start/End terminal nodes

## 6. Unsaved Changes Guard

- [x] 6.1 Implement `useUnsavedChanges` hook using React Router `useBlocker`
- [x] 6.2 Add `beforeunload` event listener for browser-level navigation warning
- [x] 6.3 Integrate `UnsavedChangesDialog` into `BPMEditor.tsx`
- [x] 6.4 Ensure `isDirty` state correctly tracks diagram, property sheet, and swimlane modifications

## 7. Formal Document UI & Export

- [x] 7.1 Create `BPMCanvasHeader` component (Logo, Company, Metadata)
- [x] 7.2 Create `BPMCanvasFooter` component (Approval Box)
- [x] 7.3 Implement "Document View" toggle in `BPMEditor` Panel
- [x] 7.4 Implement "Export to PDF/PNG" using `html-to-image`, capturing entire canvas + Header/Footer

## 8. Sidebar & Settings

- [x] 8.1 Verify BPM links in `src/components/layout/Sidebar.tsx` match the latest terminology
- [x] 8.2 Ensure `Settings` page allows configuring the Company Logo and Name used in diagrams

## 9. Final Verification

- [x] 9.1 Perform visual inspection against SK-5 Lampiran 3 & 4 (Swimlanes, Labels, Shapes)
- [x] 9.2 Verify navigation guards prevent data loss in all scenarios (internal/SPA vs external/Browser)
- [x] 9.3 Verify i18n switching for all new elements including swimlane headers
- [x] 9.4 Verify Drizzle migrations are successfully applied in local environment
