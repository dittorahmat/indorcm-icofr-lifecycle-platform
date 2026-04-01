## Why

The user requested a specific "Leaf Green" theme for the header navbar to align with corporate branding and improve visual freshness. The current white header is too generic for the specialized risk management context.

## What Changes

- Change the header background color to Emerald 600 in light mode.
- Change the header background color to Emerald 950 in dark mode.
- Update text and icon colors in the header to maintain high contrast (white in light mode, emerald-400/light-green in dark mode).
- Adjust navigation link hover and active states to complement the green theme.
- Ensure role badges remain legible on the new background.

## Capabilities

### New Capabilities
- `header-theming`: Functional requirements for the dynamic header color system based on theme state.

### Modified Capabilities
- None

## Impact

- `src/components/layout/MainHeader.tsx`: Primary component for visual changes.
- UI Consistency: The change affects the core layout of the entire application.
