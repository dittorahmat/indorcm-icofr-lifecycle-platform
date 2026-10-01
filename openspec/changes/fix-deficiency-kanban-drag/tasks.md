## 1. Single mounted Kanban tree per viewport

- [x] 1.1 Gate desktop vs mobile Kanban on `useMediaQuery('(min-width: 768px)')` (or equivalent) so only one tree mounts inside `DndContext`; verify `querySelectorAll('[data-droppable-id]')` returns exactly 4 on desktop width and exactly 1 on mobile width (no duplicates).
- [x] 1.2 Keep the existing `data-testid="deficiency-kanban-desktop"` / `"deficiency-mobile-tabs"` hooks; update tests to assert the inactive tree is absent (not merely hidden).

## 2. Reliable drag start + movement

- [x] 2.1 In `DeficiencyCard.tsx`, move `setNodeRef`/`style`/`attributes` to a plain outer `div`, nest `motion.div` inside for animation only; move `listeners` to the card header; verify pointer drag moves the card (DragOverlay visible) and buttons inside the card still receive clicks.
- [x] 2.2 Add `activeId` + `DragOverlay` in `DeficiencyBoard.tsx` (column hover via existing `useDroppable isOver`; dedicated `onDragOver` omitted as redundant since drops commit only in `onDragEnd`); add `TouchSensor` with press-delay; verify cross-column hover highlight and drop targeting on the visible column.

## 3. Workflow commit + rollback (no logic change, hardening only)

- [x] 3.1 Keep the SK-5 mapping (Submit/Review/Approve/Reject/Rollback + role guards) as-is; add rollback of the optimistic `actionPlans` patch in `workflowMutation.onError` plus `invalidateQueries(['actionplans'])`; verify a failed transition returns the card to its origin column.
- [x] 3.2 Add drag-transition test coverage: simulate `onDragEnd` Ineffective → In Review as Admin asserting `/api/actionplans/:id/workflow` called with `{ action: 'Submit' }`, and assert an illegal transition (e.g. Line 1 attempting Review) is blocked with toast and no mutation.

## 4. Verification & Compliance Mandate

- [x] 4.1 Run `DeficiencyBoard` tests plus full `npm test`; verify zero regressions.
- [x] 4.2 Execute `npm run type-check`, `npm run lint`, `npm run build` per repo mandate (sequential, output redirected to file per Windows OOM guard).
- [x] 4.3 Manual acceptance on desktop: grab card header → card lifts/follows pointer → drop Ineffective → In Review commits via workflow endpoint; card returns on role-blocked move.
