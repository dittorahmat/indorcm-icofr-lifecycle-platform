## Context

See proposal.md for motivation. Current state (`DeficiencyBoard.tsx`, `DeficiencyCard.tsx`):

1. One `DndContext` (Pointer + Keyboard sensors, `pointerWithin → closestCorners`, `onDragEnd` only) wraps **both** the desktop Kanban (`hidden md:block`, 4 columns) **and** the mobile tab stream (`md:hidden`, 1 column). Both stay mounted; droppable ids and sortable card ids exist twice.
2. `DeficiencyCard` attaches `useSortable`'s `attributes`/`listeners` only to the `GripVertical` icon div; `setNodeRef` + `style={{ transform, transition }}` sit on the outer `motion.div` which also has `animate={{ scale }}`.
3. `handleDragEnd` + `workflowMutation` (SK-5 mapping Submit/Review/Approve/Reject/Rollback with role guards) are correct and proven by production `workflowHistory` entries — the failure is purely that drags never start/move, so this code path is never reached via DnD.
4. `workflowMutation.onError` toasts but leaves the optimistic column move in place.

## Goals / Non-Goals

**Goals:**
- A pointer grab on a card header reliably starts a drag on desktop; the card follows the pointer with a visible overlay.
- Exactly one set of droppable/sortable ids registered at any viewport width; cross-column drops resolve to the visible column.
- Failed workflow transitions revert the card to its origin column.
- Mobile can drag (touch) or explicitly keeps button-only flow — decided, not accidental.

**Non-Goals:**
- Changing the SK-5 transition matrix, role guards, or the `/api/actionplans/:id/workflow` contract.
- Backend, schema, migration, or locale changes.
- Restyling the board beyond what the drag fix requires (institutional `rounded-lg`, ≥12px type, solid surfaces stay as-is).

## Decisions

### Decision 1: Unmount the hidden viewport tree instead of CSS-hiding it
- **Choice**: Gate the desktop vs mobile Kanban on a `useMediaQuery('(min-width: 768px)')` (match the `md:` breakpoint) so only one tree mounts — or split into two `DndContext`s, one per tree, with the inactive one unmounted. Either way, invariant: **one registration per id**.
- **Alternatives considered**: Keep both mounted and prefix ids per viewport (`desktop:Ineffective` vs `mobile:…`). Rejected — doubles `handleDragEnd` mapping complexity and leaves dead weight mounted.
- **Rationale**: Eliminates the non-deterministic drag-cancel at the root; also halves mounted card count (perf win on large boards).

### Decision 2: Plain-div sortable wrapper, header-level handle
- **Choice**: Outer wrapper becomes a plain `div` owning `ref={setNodeRef}`, `style`, and `attributes`; `listeners` move to the `CardHeader` (grip icon remains as affordance). `motion.div` nests inside for mount/layout animation only. Buttons/checkbox inside the card stop propagation so clicks still work.
- **Alternatives considered**: Whole-card handle. Rejected — conflicts with Action Plan / Submit / DoD buttons inside the card.
- **Rationale**: Fixes both activation (large grab target) and movement (no transform fight with Framer Motion).

### Decision 3: Complete the DnD feedback loop
- **Choice**: Track `activeId` via `onDragStart`, render the dragged card in `DragOverlay`, handle `onDragOver` for cross-column moves, keep `onDragEnd` as the single commit point to `workflowMutation`. Add `TouchSensor` (with press-delay) alongside `PointerSensor`.
- **Rationale**: Users see where the card will land; touch devices stop being second-class. No behavior change to the transition logic itself.

### Decision 4: Roll back optimistic moves on error
- **Choice**: In `workflowMutation.onError`, invalidate `['actionplans']` (refetch authoritative state) and revert the local `actionPlans` patch.
- **Rationale**: A rejected transition (e.g. backend validation) must not strand a card in the wrong governance column.

## Risks / Trade-offs

- **[Risk] Header-drag vs button-click conflicts**: header contains the grip plus action buttons nearby.
  → *Mitigation*: buttons call `e.stopPropagation()` / `onPointerDown` stop; verify clicks still fire in tests.
- **[Risk] `useMediaQuery` breakpoint drift vs Tailwind `md:`**:
  → *Mitigation*: single shared constant (768px) with a comment linking it to the Tailwind config; test both branches in jsdom via matchMedia mock.
- **[Risk] Touch drag interfering with vertical scroll on mobile**:
  → *Mitigation*: press-and-hold activation delay on `TouchSensor`; keep status-tab + action-button flow as the primary mobile path.
