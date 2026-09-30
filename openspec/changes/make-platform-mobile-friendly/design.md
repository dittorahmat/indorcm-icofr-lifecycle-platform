## Context

See `proposal.md` for motivation. Currently, core compliance tables (`RCMTable.tsx`, `TodoListGrid`, deficiency matrices) rely on wide desktop CSS layouts with min-widths exceeding `2000px`. While desktop displays render these comfortably, mobile devices experience severe horizontal overflow, unreadable truncated columns, and modal dialogs that conflict with virtual keyboards. Furthermore, fixed overlay elements like `AIFabButton` overlap with `MobileBottomNav`.

The solution must deliver an institutional, accessible, anti-slop mobile experience compliant with SK-5/DKU.MBU/11/2024 and internal front-end design mandates without disrupting existing desktop workflows.

## Goals / Non-Goals

**Goals:**
- Provide a dual-mode presentation architecture for data tables: tabular format for desktop (`>= md`), structured vertical card feed for mobile (`< md`).
- Refactor `RCMTable.tsx` so all RCM tabs (TLC, ELC, ITGC) display clean, actionable vertical cards on mobile without horizontal panning.
- Resolve floating action button overlap: offset `AIFabButton` above `MobileBottomNav` on mobile screens.
- Enhance mobile header responsiveness in `MainHeader.tsx`, consolidating overflow controls gracefully.
- Ensure all interactive touch targets meet or exceed 44x44px.
- Adhere strictly to the anti-AI slop checklist: min 12px font size, no decorative italics, no fake glassmorphism, institutional enterprise borders (`rounded-md` / `rounded-lg`).

**Non-Goals:**
- Full touch-based visual node canvas editing for BPM React Flow diagrams (BPM on mobile focuses on read-only inspection, timeline steps, or full-viewport pan/zoom).
- Changing backend database schemas or API response structures.

## Decisions

### Decision 1: Built-in Table-to-Card Rendering in `RCMTable`
- **Choice**: Embed responsive card rendering directly inside `RCMTable.tsx` using `hidden md:table` for the desktop grid and `md:hidden space-y-3` for the mobile card stream.
- **Rationale**: Keeps consumers (`TLCTabContent`, `ELCTabContent`, `ITGCTabContent`) unified and backwards-compatible without requiring separate page-level mobile orchestrators.
- **Alternative considered**: Creating a separate `MobileRCMCardList` component for each page. Rejected due to code duplication across TLC, ELC, and ITGC.

### Decision 2: Floating AI Chatbot Positioning with CSS `env(safe-area-inset-bottom)`
- **Choice**: In `AIFabButton.tsx` / `RootLayout.tsx`, apply responsive offset classes:
  ```css
  bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6
  ```
- **Rationale**: Prevents FAB from colliding with the 56px (h-14) `MobileBottomNav` while respecting iOS/Android home indicator safe areas.
- **Alternative considered**: Hiding the AI chatbot completely on mobile. Rejected because mobile users require conversational guidance on compliance rules and deficiency lookups.

### Decision 3: Responsive Drawer / Sheet Modals for Mobile Record Editing
- **Choice**: On mobile devices, detail inspection and record editing trigger full-height or bottom sheet views rather than centered dialogs that get occluded by virtual keyboards.
- **Rationale**: Follows modern mobile ergonomics where finger access to "Save" and "Cancel" buttons remains accessible.

## Risks / Trade-offs

- **[Dense Attribute Set]** RCM records contain up to 20 regulatory attributes → **Mitigation**: Mobile cards display high-priority summary attributes (Code, Name, Risk, Assertions, Effectiveness status) and provide an explicit "Lihat Detail Lengkap / Edit" button to expand all 20 fields inside a structured sheet.
- **[Performance on Large Lists]** Rendering 100+ cards on mobile DOM → **Mitigation**: Utilize existing pagination/search filtering and clean lightweight card primitives with pure CSS transitions.
