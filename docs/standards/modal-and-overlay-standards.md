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

## 4. Modal Tabs Visibility & Flex Containment

1. **Tabs Visibility Invariant**:
   - `TabsContent` (`src/components/ui/tabs.tsx`) **MUST** enforce `data-[state=inactive]:hidden`.
   - *Rationale*: CSS utility classes on children (such as `.flex` or `.h-full`) override HTML `hidden` attribute due to CSS specificity, displacing active tab content down the layout tree.
2. **Embedded Wide Matrix Containment**:
   - Every ancestor flex container inside a modal hosting wide tables (RCM TLC, ELC, ITGC) **MUST** declare `min-w-0 max-w-full w-full overflow-hidden`.
   - Missing `min-w-0` triggers CSS Flexbox default `min-width: auto`, causing the entire modal to expand to the width of the wide table (up to 5300px) and hiding the horizontal scrollbar.
3. **Internal Pill / Sub-Tab Rails**:
   - Internal tab rails (e.g. Lampiran 5.B/5.A/5.C subtabs) **MUST** declare `overflow-x-auto max-w-full touch-pan-x overscroll-x-contain scrollbar-none` on the rail container and `shrink-0 whitespace-nowrap` on individual buttons.
   - Enforced mechanically by `npm run check:modal-layout`.

---

## 5. Verification & Locking Tests

Every change touching overlay components (`src/components/ui/sheet.tsx`, `dialog.tsx`, or drawers) must be locked by unit test assertions in `src/components/ui/__tests__/layering.test.tsx` and `src/components/bpm/__tests__/BPMModalScoping.test.ts`.
