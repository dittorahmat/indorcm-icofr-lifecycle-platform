## Why

The current RCM (Regulatory Compliance Matrix) tables for TLC, ITGC, and ELC utilize a low-contrast zebra stripe pattern (slate-50) and suffer from a "double horizontal scroll" issue. This occurs because both the `Table` component wrapper and the main layout container provide scrollbars, leading to a confusing user experience and wasted screen real estate. Refining these UI elements will improve readability and navigation efficiency for regulatory compliance tasks.

## What Changes

- **UI Refinement**: Change the even-row background color in RCM tables from `bg-slate-50/50` to a more distinct `#A9A9A9`.
- **Scroll Management**: Eliminate redundant horizontal scrollbars by consolidating scroll control to the main content container.
- **Component Enhancement**: Update the shared `Table` component to support a `noWrapper` prop, allowing parent containers to manage overflow behavior.
- **Layout Alignment**: Adjust `RCMTLCPage`, `RCMITGCPage`, and `RCMELCPage` to utilize the new scroll management pattern.

## Capabilities

### New Capabilities
- `rcm-ui-standard`: Defines the visual and behavioral standards for large-scale regulatory compliance matrices, specifically addressing zebra striping contrast and scroll ergonomics.

### Modified Capabilities
<!-- No core behavioral requirements are changing, only implementation-level UI patterns. -->

## Impact

- `src/components/ui/table.tsx`: Shared UI component.
- `src/pages/rcm/RCMTLCPage.tsx`: Transaction Level Control matrix.
- `src/pages/rcm/RCMITGCPage.tsx`: IT General Control matrix.
- `src/pages/rcm/RCMELCPage.tsx`: Entity Level Control matrix.
