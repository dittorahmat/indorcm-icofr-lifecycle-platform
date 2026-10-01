## Why

The previous fix (`e38e65e`, change `fix-deficiencies-navigation-and-kanban-dnd`) restored the Kanban drop containers and the `workflowStatus` transition mapping, and the workflow API itself is proven healthy (production data shows `Submit` transitions succeeding via board buttons, plus one drag-and-drop transition that fired). Yet drag-and-drop on the Deficiency Board (`/deficiencies`) still fails in the field: on desktop, grabbing the card's grip handle never starts a drag — the card does not lift or follow the pointer, so `onDragEnd` never fires and no `POST /api/actionplans/:id/workflow` is issued from DnD.

Field diagnosis (explore session 2026-10-01) isolated three compounding causes, none of which were touched by `e38e65e`:

1. **Duplicate DnD identities.** A single `DndContext` wraps two simultaneously-mounted trees: the desktop Kanban (`hidden md:block`) and the mobile tab stream (`md:hidden`). CSS hiding does not unmount, so every droppable id (`Ineffective`, `In Review`, …) and every sortable card id is registered twice. `@dnd-kit` does not support duplicate ids — collision resolution can target the hidden (zero-rect) tree and the drag cancels. This also explains why a drag succeeded at least once (non-deterministic, render-dependent).
2. **Grip-only activator.** `attributes` + `listeners` live solely on the 6-dot `GripVertical` icon (~20px). A grab anywhere else on the card does nothing, and the tiny target makes failed grabs the norm.
3. **Framer Motion wrapping the sortable node.** `ref={setNodeRef}` + `style={{ transform }}` sit on a `motion.div` that also runs `animate={{ scale }}`. Framer Motion owns `transform`, so even when a drag activates, the card cannot visually follow the pointer.

Fixing these restores the SK-5 Kanban interaction (Ineffective → In Review → In Approval → Resolved) without touching the backend or the governance matrix.

## What Changes

- **Isolate DnD per viewport**: render exactly one Kanban tree inside `DndContext` at a time (unmount the hidden tree, not just CSS-hide it), so every droppable/sortable id is registered once.
- **Enlarge the drag handle**: move `listeners` to the card header (whole header grabs; grip icon becomes visual affordance only), keeping action buttons clickable.
- **Separate sortable wrapper from animation**: plain `div` owns `setNodeRef`/`style`/`attributes`; `motion.div` moves inside for enter/exit animation only.
- **Complete the DnD kit**: `activeId` state + `DragOverlay` + `onDragOver` for visible cross-column feedback, `TouchSensor` so mobile can drag too.
- **Rollback optimistic update** in `workflowMutation.onError` so a failed transition does not strand a card in the wrong column.

## Capabilities

### Modified Capabilities
- `remediation-tracking`: Kanban drag-and-drop must reliably start, show cross-column feedback, and commit SK-5 workflow transitions (`Submit`/`Review`/`Approve`/`Reject`/`Rollback`) per the existing role matrix; failed transitions roll back visually.

## Impact

- `src/pages/deficiencies/DeficiencyBoard.tsx`: single mounted Kanban tree per viewport, `activeId`/`DragOverlay`/`onDragOver`, sensors incl. touch, rollback on mutation error.
- `src/components/deficiencies/DeficiencyCard.tsx`: plain-div sortable wrapper, header-level drag handle.
- `src/pages/deficiencies/__tests__/DeficiencyBoard.test.tsx`: real drag-transition coverage (not just droppable-id existence).
- No backend, schema, i18n, or role-matrix changes.
