## Why

User complained that the typography (size, type, and color of fonts) for the data content in the RCM (TLC/ELC/ITGC) views and horizontal matrices is not uniform, leading to a poor visual experience. Aligning and standardizing the typography across these components will improve readability, data scanning, and professional aesthetics.

## What Changes

- **Typography Unification**: Standardize text size, font weight, color, and styles across RCM TLC, ELC, and ITGC tables/matrix views.
- **Remove Inline Layout Inconsistencies**: Consolidate column font styles (`Process Information`, `Sub Process`, `Executing Company`, etc.) into a clean flat grid format with uniform typography (e.g., matching standard `text-xs text-slate-800 font-normal` for body content and clear, subtle uppercase tokens for metadata/headers).

## Capabilities

### New Capabilities
*None*

### Modified Capabilities
*None (This is purely a visual styling, typography unification, and consistency fix across existing components, rather than changing functional requirements).*

## Impact

- `src/components/rcm/TLCTabContent.tsx`
- `src/components/rcm/ELCTabContent.tsx`
- `src/components/rcm/ITGCTabContent.tsx`
- `src/pages/rcm/RCMTLCPage.tsx`
- `src/pages/rcm/RCMELCPage.tsx`
- `src/pages/rcm/RCMITGCPage.tsx`
- `src/components/rcm/RCMTable.tsx`
- `src/pages/rcm/VerificationDesignPage.tsx`
