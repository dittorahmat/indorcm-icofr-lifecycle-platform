## Context

See proposal.md (Why). Current state: `PageHeader` (`src/components/layout/PageHeader.tsx:15,31`) stacks every CTA to full-width rows on mobile; filter/KPI cards are always mounted with no shared collapse primitive (only `ScopingPage.tsx:319-335` has the correct `useIsMobile + useState(!isMobile) + hasUserToggledRef` pattern); wide tables (`BPMAccountAssertion.tsx:80-86`, RCM matrices up to 4800px) lack `overflow-x-auto` wrappers. Breakpoint usage is inconsistent (`md:` vs `sm:`) prolonging stacks on 640-768px tablets.

## Goals / Non-Goals

**Goals:**
- Fix the root in shared components first, then adopt per-page so no new page can reintroduce the pattern.
- Keep numeric KPIs glanceable (densify, never accordion); collapse filter walls (accordion).
- Guarantee zero page-level horizontal scroll; wide content scrolls only inside its own wrapper.

**Non-Goals:**
- No OM/PM, scoping, workflow, or backend logic changes.
- No visual rebrand; keep existing Shadcn/Tailwind tokens, `rounded-md/lg`, min 12px type.

## Decisions

### Decision 1: Compact `PageHeader` via CSS only (no JS state)
- *Approach*: clamp description to 1 line on mobile (`line-clamp-1`), turn the CTA slot into a horizontal scroll row (`flex-nowrap overflow-x-auto max-w-full`) below `sm:` instead of `flex-wrap` stacking. Title row keeps `SidebarTrigger h-11 w-11` + responsive title.
- *Rationale*: header height is a layout problem, not a state problem — CSS containment fixes every consumer at once without per-page JS.
- *Alternatives considered*: per-page CTA rewiring — rejected (N fixes, reintroduces drift); hiding CTAs behind a menu — rejected (hurts discoverability of primary actions).

### Decision 2: New `CollapsibleFilterCard` primitive (Scoping pattern extracted)
- *Approach*: `useIsMobile()` for initial `open` (`!isMobile`), `hasUserToggledRef` so resize doesn't override explicit user choice, trigger button `min-h-[44px] w-full` with chevron + i18n labels, content in `AnimatePresence`-free simple conditional (no distracting motion) with `max-h-[42vh] overflow-y-auto` guard for tall filter bodies.
- *Rationale*: single source of truth; every filter wall (BPM, CSA, Reports, RCM) gets identical mobile behavior and desktop stays open.
- *Alternatives considered*: raw `<details>` — rejected (toggle state can't sync with header buttons); CSS-only hide — rejected (same desync reason as the Scoping design).

### Decision 3: KPI densify, filter collapse (hybrid per user confirmation)
- *Approach*: KPI grids go `grid-cols-2` on small base (or horizontal snap for 5-item Appendix10 counters); filter walls go inside the collapsible.
- *Rationale*: KPIs answer questions at a glance (hiding them blinds the user); filters ask questions (safe to defer behind a tap).
- *Alternatives considered*: accordion everything — rejected (hides critical numbers); pills for filters — rejected (too many tall options).

### Decision 4: Mandatory table scroll-wrapper convention
- *Approach*: any `<Table>` with fixed/min widths lives in `div.overflow-x-auto.max-w-full.touch-pan-x.overscroll-x-contain.min-w-0`; card container keeps `max-w-full`.
- *Rationale*: fixes `BPMAccountAssertion` (840px), RCM (2200-4800px), import preview (640px) with one rule; page shell keeps `min-w-0 max-w-full w-full` (no top-level `overflow-hidden` traps).

## Risks / Trade-offs

- [Touching shared `PageHeader` risks wide visual regression] -> land shared changes first with header unit tests + per-page spot checks before batch adoption.
- [`useIsMobile` resolves `undefined` on first render] -> `hasUserToggledRef` + effect sync (Scoping pattern) prevents flicker/override.
- [Collapsible content taller than viewport] -> `max-h-[42vh] overflow-y-auto` inside expanded panel.
- [Dual-render (`block md:hidden` + `hidden md:block`) double-mounts in jsdom] -> tests use `getAllByText`/scoped queries + `closest()` for scroll-container asserts.
