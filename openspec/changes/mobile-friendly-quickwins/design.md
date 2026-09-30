## Context

See `proposal.md` for motivation. Currently, `MainHeader`, `FiscalYearSelector`, and `PageHeader` are designed primarily for desktop viewports (>768px). In addition, `CSAPage.tsx` renders all CSA records inside an HTML table element with extensive column widths, causing mobile viewers to scroll horizontally and lose visibility of process IDs and validation triggers.

The codebase strictly adheres to SK-5/DKU.MBU/11/2024 compliance, requiring no sub-12px fonts, no glassmorphism, institutional enterprise radii (`rounded-md` or `rounded-lg`), and full internationalization (`i18n`).

## Goals / Non-Goals

**Goals:**
- Optimize `MainHeader` and `FiscalYearSelector` layout for screens < 640px to eliminate horizontal clutter.
- Adjust `PageHeader` typography and margins to preserve vertical space on mobile devices.
- Introduce a mobile card-stack view in `CSAPage.tsx` alongside the desktop table using clean Tailwind responsive utility toggles (`md:hidden` vs `hidden md:block`).
- Ensure all interactive touch targets meet WCAG accessibility standards (>= 44x44px).

**Non-Goals:**
- Full redesign of complex diagramming canvases (e.g. React Flow BPM editor) - that will be handled in a separate phase.
- Modifying backend schemas or API endpoints - all responsive changes are strictly frontend UI presentation.

## Decisions

### 1. Dual View Presentation in CSAPage (Table on Desktop, Cards on Mobile)
- **Rationale**: Transforming an enterprise audit table into a purely stacked card view on desktop would disrupt desktop auditor workflows. By keeping `<Table className="hidden md:table">` and introducing `<div className="md:hidden space-y-3">`, both form factors receive optimal ergonomics.
- **Alternative considered**: Pure CSS horizontal scroll indicator (`overflow-x-auto`). Rejected because mobile users frequently miss columns on the far right and find long horizontal scrolling tedious.

### 2. Compact Fiscal Year Pill on Mobile Viewport
- **Rationale**: On mobile (<640px), the selector button displays `FY ${workingYear}` or the 4-digit year without the wordy prefix, shrinking width while preserving the modal calendar selection trigger.
- **Alternative considered**: Moving the year selector entirely inside the hamburger drawer. Rejected because the working year is a global filter that users need to see and switch easily at all times.

### 3. Responsive PageHeader Margins
- **Rationale**: Changing `PageHeader` to use `text-xl sm:text-2xl md:text-3xl` and `mb-4 md:mb-8` reclaims ~80px of vertical viewport on mobile screens without altering desktop visual hierarchy.

## Risks / Trade-offs

- **[Duplication of record action buttons in Card & Table]** → Mitigation: Extract or reuse record action handlers (`onExportPDF`, `onExportXLS`, `isExpanded` toggles) consistently across both presentations.
- **[Font size constraints per anti-AI slop rules]** → Mitigation: Keep all mobile card labels and badges at `>= text-xs` (12px) with `font-medium` or `font-semibold`.
