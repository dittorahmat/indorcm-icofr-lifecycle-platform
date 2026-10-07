## Context

In `BPMEditor`, OCR results are reviewed in `BPMOcrModal` (via `useOcrStaging`) and applied through `handleApplyOcr` in `useBPMCanvasHandlers`. Currently, `handleApplyOcr` executes `setNodes(finalNodes)` and `setEdges(standardEdges)`, which completely overwrites existing canvas items.

See `proposal.md` for background and motivation.

## Goals / Non-Goals

**Goals:**
- Provide a configurable UI in `BPMOcrModal` allowing the user to select between Overwrite and Append.
- When Append is selected, provide direction selection: Below (Vertical) and Right (Horizontal).
- Implement pure offset calculation and ID re-mapping functions (`calculateAppendOffset`, `remapElementsForAppend`) with dedicated unit tests.
- Ensure that appended elements do not overlap with existing canvas nodes and maintain correct edge connections.
- Ensure existing undo/redo (`pushState`), dirty tracking, and fitView work seamlessly.
- Strict compliance with project rules: LOC limit (under 400 lines), no sub-12px font, mobile-first responsive layout, and full i18n support.

**Non-Goals:**
- Automatic semantic merging of duplicate process steps across old and new diagrams (the user manually adjusts or deletes redundant steps on the canvas).
- Auto-routing edges between existing nodes and newly appended nodes (OCR connects its own internal graph; cross-graph wiring is left to user discretion).

## Decisions

### 1. UI Selection: Explicit Radio Group in OCR Review
- **Choice**: Radio group cards in `BPMOcrModal` during the review step.
- **Why**: Radio group is explicit, visible, and prevents inadvertent data destruction. Split buttons hide options under nested click menus.
- **Alternative considered**: Split button dropdown on the "Apply" CTA. Rejected because it hides direction configuration and is error-prone.

### 2. Pure Calculation Utility Extraction
- **Choice**: Extract bounding box, offset, and ID re-mapping logic into an isolated pure function (e.g. `src/utils/bpm-ocr-append.ts`) with comprehensive unit tests (`bpm-ocr-append.test.ts`).
- **Why**: Keeps `useBPMCanvasHandlers.ts` and `useOcrStaging.ts` slim (under the 400 LOC limit) and allows direct unit testing of offset calculations, swimlane bounds, and ID mapping.

### 3. Collision-Free Offset Logic
- **Bounding Box Calculation**:
  - Existing diagram bounds:
    - $X_{max} = \max(\text{node.position.x} + (\text{node.width} \lor 200))$
    - $Y_{max} = \max(\text{node.position.y} + (\text{node.height} \lor 80))$
    - $X_{min} = \min(\text{node.position.x})$
    - $Y_{min} = \min(\text{node.position.y})$
  - Margin constants: `GAP_Y = 160`, `GAP_X = 200`.
- **Direction Handling**:
  - `below`:
    - Shift Y by: $Y_{max} + GAP\_Y - Y_{new\_min}$
    - Align X with existing diagram start: $X_{min} - X_{new\_min}$ (or keep relative X offset)
  - `right`:
    - Shift X by: $X_{max} + GAP\_X - X_{new\_min}$
    - Align Y with existing diagram start: $Y_{min} - Y_{new\_min}$
- **ID Re-mapping**:
  - To avoid ID collisions (e.g., both diagrams containing `node_1` or `swimlane_1`), appended nodes receive a unique prefix: `ocr_${Date.now()}_${index}_${originalId}`.
  - Edges are remapped: `source = idMap.get(edge.source)`, `target = idMap.get(edge.target)`.
  - Swimlane child relationships (`parentId`) are remapped via `idMap`.

## Risks / Trade-offs

- **[Risk] High canvas node count slows down React Flow** → **Mitigation**: Standard React Flow viewport virtualization handles nodes smoothly; OCR diagrams are typically 10-50 nodes.
- **[Risk] Swimlanes overlapping or extending incorrectly** → **Mitigation**: Swimlane widths and heights are taken into account when calculating $X_{max}$ and $Y_{max}$.
- **[Risk] File size limit violation (>400 LOC)** → **Mitigation**: Separate UI selector into a dedicated sub-component (`OcrImportModeSelector.tsx`) and math logic into `bpm-ocr-append.ts`.
