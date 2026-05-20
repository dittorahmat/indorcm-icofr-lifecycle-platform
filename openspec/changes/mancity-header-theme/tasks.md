## 1. Refactor BPMModal Header

- [x] 1.1 Update `src/components/bpm/BPMModal.tsx` to use `bg-mancity-pattern` and `text-primary-foreground` in the DialogHeader.
- [x] 1.2 Adjust sub-header elements (Badge, Printer icon, XCircle button) for color consistency and contrast.

## 2. Refactor RCMGroupRow Header

- [x] 2.1 Update `src/components/rcm/RCMGroupRow.tsx` to use `bg-mancity-pattern` and `text-primary-foreground` for `depth === 0` rows.
- [x] 2.2 Remove or soften the `border-slate-400` for a cleaner look.
- [x] 2.3 Adjust the side indicator color (Indigo-500) if it looks out of place.

## 3. Verification

- [x] 3.1 Verify BPMModal visual appearance.
- [x] 3.2 Verify RCMGroupRow visual appearance.
- [x] 3.3 Run lint and type-check to ensure no regressions.
