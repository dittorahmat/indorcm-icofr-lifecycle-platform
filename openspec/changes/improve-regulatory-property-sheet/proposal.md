## Why

The current `RegulatoryPropertySheet` component suffers from poor readability due to its limited width (slider), small font sizes, and weak visual hierarchy. This hinders the efficiency of corporate staff during the ICOFR audit process, which requires high attention to detail and precision.

## What Changes

- Migrate `RegulatoryPropertySheet` from a slider-based `Sheet` to a full-screen modal `Dialog`.
- Enhance typography (increase font size, improve contrast) to meet professional standards.
- Reorganize input layout for Risks and Controls using an accordion pattern for better information management.
- Improve visual hierarchy for action buttons (Delete and Save) to ensure safety and clarity.
- Implement full localization (i18n) for all new and updated UI text labels.

## Capabilities

### New Capabilities
- `rcm-properties-modal`: Implementation of the full-screen dialog for property management.
- `rcm-risk-control-accordion`: Management of risks and controls using collapsible sections.

### Modified Capabilities
- None.

## Impact

- `src/components/rcm/properties/RegulatoryPropertySheet.tsx`
- Relevant styles in `App.css` or `index.css` may need adjustments.
