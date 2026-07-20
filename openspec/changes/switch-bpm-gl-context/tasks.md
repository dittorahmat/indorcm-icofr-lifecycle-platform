## 1. Frontend: Linked GL Context Navigation UI

- [x] 1.1 In `BPMEditor.tsx`, extract the list of linked GLs from `selectedGLs` and map them into a distinct "Switch Context" navigation list inside the Linked GLs popover.
- [x] 1.2 Format the "Switch Context" items as clickable elements (e.g., buttons or text links with a navigation icon) to clearly separate them from the association checkboxes.
- [x] 1.3 Add a visual indicator to show which GL code is the active context (e.g., highlighting or a green badge).

## 2. Frontend: URL State Sync & Context Switch Logic

- [x] 2.1 Integrate `useSearchParams` or utilize a path change callback to read/write search parameters in `BPMEditor.tsx`.
- [x] 2.2 Implement the switch context handler that checks if `isDirty` is true and shows a confirmation dialog before navigation.
- [x] 2.3 On confirmation (or if not dirty), update URL parameters (`noGL` and `glDesc`) when switching contexts, letting the editor fetch the new GL's specific diagram and RCM data.
- [x] 2.4 Verify that closing the BPM Editor modal in `BPMPage.tsx` keeps the newly switched GL code in the parent page filters, rendering the correct process list.

## 3. Compliance Validation & Testing

- [x] 3.1 Verify that shifting GL contexts dynamically refreshes node properties and RCM matrix mappings for the target GL.
- [x] 3.2 Run standard validation workflow (`npm run type-check`, `npm run lint`, and `npm run build`) to ensure system integrity.
