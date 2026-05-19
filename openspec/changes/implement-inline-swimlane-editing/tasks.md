## 1. Core Logic & Data Flow

- [x] 1.1 Inject `onChangeDepartment` and `onChangeFunction` handlers during node initialization in `BPMEditor.tsx`
- [x] 1.2 Update `onNodeClick` in `BPMEditor.tsx` to ignore swimlane nodes (prevent property sheet popup)

## 2. UI & UX Refinement

- [x] 2.1 Add `nodrag` class and stop propagation to inputs in `SwimlaneNode` (`BPMCustomNodes.tsx`)
- [x] 2.2 Refine input styling for "ghost" behavior (borderless until hover/focus)
- [x] 2.3 Ensure placeholders in `SwimlaneNode` are localized using `t()`

## 3. Verification

- [x] 3.1 Verify changes trigger `isDirty` state and Save button activation
- [x] 3.2 Verify persistence by saving and reloading a diagram
- [x] 3.3 Run `npm run build` and `npm run type-check` to ensure integrity
