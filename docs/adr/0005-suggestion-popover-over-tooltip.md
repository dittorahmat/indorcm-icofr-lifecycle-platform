# Suggestion Popover (Popover + Command) Instead of Tooltip for AI Suggestions

Although the request was phrased as "tooltip", clickable AI suggestion lists are built with Radix `Popover` + cmdk `Command` (following `SignificantApplicationCombobox`), not Radix `Tooltip`.

## Considered Options

- `Tooltip`: hover-only hint container, unsuitable for clickable lists, keyboard navigation, loading/error/empty states, and 320px viewports.
- `Popover + Command` (chosen): click-to-open, keyboard-navigable items, truncating context header, retry/refresh actions, `w-[calc(100vw-2rem)]` mobile-safe panel. Canonical glossary term: `AI Suggestion Popover` (`_Avoid_: tooltip`).
