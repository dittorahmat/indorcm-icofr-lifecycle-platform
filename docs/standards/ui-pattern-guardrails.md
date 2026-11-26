# UI & CSS Pattern Guardrails

- **Flex-1 Scroll/Table Containers:** Any `flex-1` container with horizontal margin (`mx-*`) and `max-w-full` MUST include `min-w-0` to prevent horizontal overflow/clipping on 320px–390px viewports.
- **Table Cell Typography:** Shared table components (`RCMTable`, etc.) own the default cell font-size (`text-sm`); avoid duplicating the default font-size token in individual column `className` definitions.
- **CSS Pattern Classes:** When re-theming existing pattern classes (e.g. `.bg-mancity-pattern`), update only the CSS color variables (`--header-mancity*`) and preserve the pattern definition (`background-image`).
- **Windows Batch Edits:** Prefer `node -e` over inline PowerShell `foreach ($f ...)` commands when editing multiple files via CLI to avoid `$` variable expansion issues in the outer shell.
