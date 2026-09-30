## Context

See `proposal.md` for motivation. Current state: Jalur 1 CSA (`CSAPage`, `TodoListPage`) and RCM (`TLC/ELC/ITGC/RCMTable`) already use the established dual-render pattern (`hidden md:block` desktop table + `md:hidden` mobile cards). Jalur 2 CSA (`CSATabContent` → `CSAList`/`CSAForm` via `useCSA` hook) is desktop-only: `CSAList` is a plain 4-column table, `CSAForm` (537 lines) renders a multi-column sample matrix with `min-w-[200px]` heads and a hidden file input without camera capture. `BPMPage` composes `BPMDiagramList` (horizontal scroll), `BPMEditor` (React Flow canvas + `ResizablePanel`), worksheet (`min-w-[2500px]`), and `CSAModal`/`BPMModal` dialogs. `DeficiencyBoard` renders a horizontal Kanban (`overflow-x-auto`) with a `text-[10px]` counter badge. Constraints: no backend/API/schema changes; strict anti-AI-slop (min 12px, `rounded-md/lg`, solid surfaces); full i18n; dual-render test convention (`getAllByText`, `closest()`).

## Goals / Non-Goals

**Goals:**
- Reuse the proven dual-render + bottom-sheet patterns for all new mobile views (zero new dependencies).
- Keep `useCSA` state logic untouched; only the presentation layer branches by breakpoint.
- Make BPM on mobile explicitly read-only with a visible "Mode Lihat" contract.
- Lock wide tables inside their own scroll containers so the page never overflows horizontally.

**Non-Goals:**
- Touch-based BPM node editing, edge routing, or worksheet cell editing on mobile.
- Offline persistence/IndexedDB for drafts (draft safety relies on existing `useUnsavedChanges` + server draft; a local-draft upgrade is a separate future change).
- Changing validation, granular-verification, or approval workflow semantics.

## Decisions

### Decision 1: Dual-render inside `CSAList` and `CSAForm` (not separate pages)
- **Choice**: Embed `hidden md:block` table + `md:hidden` cards/stepper directly in both components, mirroring `RCMTable`.
- **Rationale**: Consumers (`CSATabContent` list/form views, `BPMModal`, `CSAModal`) stay unified; the existing dual-render test convention applies unchanged.
- **Alternative considered**: Separate `MobileCSA*` components. Rejected: duplicates the `useCSA` wiring (fields/append/watchSamples) and doubles i18n surface.

### Decision 2: Sample stepper over stacked full form
- **Choice**: One sample per screen with Prev/Next + position indicator + jump-to-sample, driven by the existing `fields` array index as stepper state (local UI state only, not form state).
- **Rationale**: A 5-sample × 6-attribute matrix is unscrollable-as-cards; a stepper keeps one decision in focus and makes sticky actions meaningful. No `useCSA` changes required.
- **Alternative considered**: All samples stacked as long cards. Rejected: loses position context and buries the sticky action relevance.

### Decision 3: Camera via `capture` on the existing hidden input
- **Choice**: Add a dedicated camera button (`capture="environment"`) next to the gallery/upload button, both funneling into the existing `onFileChange → uploadMutation` path with `activeUploadRow` unchanged.
- **Rationale**: Zero new upload plumbing; MIME allowlist stays server-enforced. A second visible input (rather than toggling `capture` on one) avoids iOS behavior quirks where `capture` removes the gallery choice.
- **Alternative considered**: Custom camera component (getUserMedia). Rejected: permission/HTTPS/file-size complexity for no regulatory benefit.

### Decision 4: BPM read-only by hiding edit chrome, not forking the canvas
- **Choice**: Same React Flow canvas with `nodesDraggable={false}` + `elementsSelectable` for tap, edit toolbar/panels hidden below `md`, node tap opens the existing property content in a Radix bottom-sheet (read-only props).
- **Rationale**: One canvas implementation; the read-only contract is a prop/config switch plus CSS, so desktop fidelity cannot drift from mobile view.
- **Alternative considered**: Separate mobile BPM viewer library. Rejected: legend (Lampiran 3) and node fidelity would need parallel maintenance.

### Decision 5: Deficiency Kanban → segmented tabs (not horizontal scroll-snap)
- **Choice**: Status tabs with per-status counts + vertical card stream; status moves via 44px+ select control, not drag-and-drop.
- **Rationale**: Scroll-snap carousels hide content and break screen-reader order; tabs preserve the existing status model one-to-one. Touch DnD across columns is an established anti-pattern at 360px.

## Risks / Trade-offs

- **[537-line `CSAForm` edit risk]** Touching a large form risks desktop regression → Mitigation: additive mobile blocks only; desktop JSX byte-identical; existing tests plus new dual-render tests per the repo convention.
- **[Photo size on slow networks]** Camera photos can be multi-MB → Mitigation: client-side downscale/compress before `uploadMutation` (long-edge cap), with original filename preserved for audit trail; failure shows Retry keeping the captured image.
- **[Worksheet summary fidelity]** Card summaries could omit a regulatory column an auditor needs → Mitigation: summary shows key columns + status, and the full table remains one tap away in a locked scroll container; no data removed, only progressive disclosure.
- **[Bottom-sheet vs keyboard]** Sticky actions can collide with the virtual keyboard → Mitigation: sticky bar uses `env(safe-area-inset-bottom)` + `visualViewport`/`focus` behavior already used by `TODVerificationDialog` sheet; actions sit above `MobileBottomNav` offset.

## Migration Plan

1. Land `CSAList` cards + `DeficiencyBoard` quick-wins first (lowest risk, no form logic).
2. Land `CSAForm` stepper + camera upload behind the same breakpoint (no flag needed; desktop untouched).
3. Land BPM read-only viewer + worksheet summaries.
4. Rollback per-component: each dual-render block is self-contained; reverting restores the desktop table which was never modified.

## Open Questions

- Long-edge cap for camera compression (e.g. 1600px vs 2048px): answerable during implementation from upload-size telemetry; does not change specs or task breakdown.
