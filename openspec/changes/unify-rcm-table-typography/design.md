## Context

The `RCMTable` component is used dynamically to render the horizontal matrices for TLC, ELC, and ITGC processes. However, their cells render data columns using highly inconsistent font sizes, weights, and colors (e.g., mixing `text-slate-900 font-bold`, `text-slate-600 text-xs`, `text-slate-700 leading-tight`, etc.). This causes a jagged visual experience and hampers readability.

## Goals / Non-Goals

**Goals:**
- Unify cell typography in `RCMTable` column configurations to use a clean, uniform flat layout.
- Ensure all text inside table columns (`Process Information`, `Sub Process`, `Executing Company`, `Risk Description`, etc.) defaults to the same font size (`text-xs`), family (standard sans-serif), weight (`font-normal`), and color (`text-slate-700` or `text-slate-800`), except for specific code/ref badges or statuses where monospace or semantic styling is explicitly required.
- Align typography across ELC, TLC, and ITGC tab components to share the same hierarchy and clean layout tokens.

**Non-Goals:**
- Modifying the underlying data fetch logic, data structures, or endpoints.
- Re-architecting table sorting/filtering mechanisms.

## Decisions

### 1. Unified Table Data Class
All standard text-based data cells inside `RCMTable` groups (e.g., `Process Info`, `Sub Process`, `Executing Company`, `Risk Description`, `Control Name`, `Control Description`) should resolve to a single visual style:
- Size: `text-xs` (12px)
- Weight: `font-normal`
- Color: `text-slate-700`
- Leading: `leading-normal` or `leading-relaxed` (for descriptions)

For cells requiring specific rendering:
- Monospace tags (e.g., `Location`, `affectedFsliItem`, `Control Ref`): Use `font-mono text-xs font-semibold text-slate-500`
- Custom render elements (e.g., Badges, status alerts): Retain their structured designs but keep their labels aligned to `text-[10px]` or `text-xs` uppercase tracking-wide.

## Risks / Trade-offs

- **Risk**: A column width might feel narrow if text density changes.
- **Mitigation**: Adjust columns default width or use `leading-normal` to ensure multi-line wrap looks clean.
