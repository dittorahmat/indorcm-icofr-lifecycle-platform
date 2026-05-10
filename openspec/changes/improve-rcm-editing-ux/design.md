## Context

The current implementation of inline editing in RCM pages (TLC, ITGC) is fragmented across different components and lacks a unified interaction model. RCMELC currently lacks editing capability entirely. Users need a consistent, efficient, and visually clean approach to edit controls inline, while also benefiting from a modernized UI aesthetic that aligns with corporate compliance standards (SK-5).

## Goals / Non-Goals

**Goals:**
- Provide a standardized, per-row inline editing experience across TLC, ITGC, and ELC.
- Modernize the table UI: replace dense zebra-striping with cleaner row separators, improve whitespace, and unify header toolbars.
- Ensure all pages are accessible, localized, and guarded against unsaved data loss.

**Non-Goals:**
- Complete overhaul of the backend API (we will stick to the existing batch-update/endpoint patterns as much as possible, wrapping them for individual row saving).
- Redesign of the core compliance logic (SK-5) itself; only the display and interaction layers are in scope.

## Decisions

- **Direct Inline Editing**: We will replace the current "Edit Row" toggles (`RCMTLC`) and manual input rows with direct cell inputs (`RCMITGC` style) where cells only become interactive inputs upon clicking the Edit (✎) icon.
- **Row-Level Save/Cancel**: To support atomic per-row saving, each editable row will feature action controls (✎/✓/✕). This allows immediate `saveMutation` per row and cleaner UX.
- **Visual Rhythm**: Zebra-striping will be replaced by `border-b` row separators and `hover:bg-slate-50/50` to improve readability and visual focus.
- **Header Standardization**: A shared `RCMHeader` pattern will be established, moving consistent elements (search, filter, metadata) into a reusable layout pattern for all RCM-related pages.

## Risks / Trade-offs

- **Performance**: High volume of row-level API calls for individual saving. Mitigation: Implement robust `loading` states on individual row icons to avoid user frustration during latency.
- **Compatibility**: Differences in current page implementations require custom refactoring per module. Mitigation: Build a reusable `InlineEditRow` logic that wraps table cells for consistency.
