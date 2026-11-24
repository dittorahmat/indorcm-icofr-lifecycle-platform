# Modal & Overlay Architecture Standards

## Purpose
This document defines the structural, accessibility, and layering invariants for all modals, dialogs, drawers, and overlay sheets in IndoGRC Pro. Adhering to these standards prevents occlusion bugs and ensures automated QA/browser testing compatibility.

---

## 1. Z-Index Layering Hierarchy

All overlays must strictly conform to the central layering baseline:

| Component Type | Base Class / Elevation | Purpose | Test Anchor |
|---|---|---|---|
| **Modal Dialog** | `z-[1000]` | Baseline modal surface (`DialogContent`) | `layering.test.tsx` |
| **Drawer / Sheet** | `z-50` / `z-[1000]` | Side-drawers and mobile inspection panels | `layering.test.tsx` |
| **Close Button** | `z-50` | `SheetPrimitive.Close` or dismiss triggers | `layering.test.tsx` |
| **Dropdown / Select** | `z-[1100]` | `SelectContent`, `PopoverContent` above dialogs | `layering.test.tsx` |

### The Close Button Occlusion Rule
All overlay close buttons (`SheetClose` / `X`) **MUST** carry an explicit `z-50` elevation class:
```tsx
<SheetPrimitive.Close className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ...">
  <X className="h-4 w-4" />
  <span className="sr-only">Close</span>
</SheetPrimitive.Close>
```
*Rationale*: Drawer headers or internal card wrappers frequently declare `relative` positioning or background fills that visually or interactively occlude dismiss controls if unlayered.

---

## 2. Minimum Padding & Touch Targets

1. **Header & Footer Minimum Padding**:
   - Containers (`DialogHeader`, `DialogFooter`, `SheetHeader`, `SheetFooter`) **MUST** maintain at least `p-4 sm:p-5` or `p-4 sm:p-6`.
   - Enforced mechanically by `npm run check:dialog-padding`.
2. **Interactive Touch Target**:
   - Dismiss, submit, and navigation buttons on mobile viewports **MUST** satisfy `min-h-[44px]` (or `h-11 sm:h-10 min-h-[44px]`).

---

## 3. Responsive Dialog & Sheet Actions

Action footers inside dialogs and sheets must stack reverse-flex on mobile:
```tsx
<DialogFooter className="flex-col-reverse sm:flex-row gap-2">
  <Button variant="outline" className="w-full sm:w-auto min-h-[44px]">
    {t('common:actions.cancel')}
  </Button>
  <Button className="w-full sm:w-auto min-h-[44px]">
    {t('common:actions.save')}
  </Button>
</DialogFooter>
```

---

## 4. Verification & Locking Tests

Every change touching overlay components (`src/components/ui/sheet.tsx`, `dialog.tsx`, or drawers) must be locked by unit test assertions in `src/components/ui/__tests__/layering.test.tsx`.
