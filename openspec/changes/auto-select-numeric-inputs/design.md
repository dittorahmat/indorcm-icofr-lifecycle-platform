## Context

See proposal.md - Why.
All input components across the application rely on the foundational `Input` component defined at `src/components/ui/input.tsx`. Rather than altering dozens of domain form components individually, updating the base `Input` component ensures uniform behavior across all current and future numeric inputs.

## Goals / Non-Goals

**Goals:**
- Automatically highlight/select all text when focusing any numeric or currency input field.
- Prevent browser mouseup race conditions where mouse release cancels text selection.
- Provide explicit control via `selectOnFocus?: boolean` prop for explicit opt-in or override.
- Ensure standard text fields (search, names, descriptions) retain standard non-selecting cursor placement.

**Non-Goals:**
- Altering server-side data formats, schemas, or calculation formulas.
- Forcing full currency mask formatting (dots/commas masking) on unmasked numeric inputs.

## Decisions

### Decision 1: Base Component Enhancement vs. Per-Page Custom Component
- **Chosen**: Enhance `src/components/ui/input.tsx`.
- **Rationale**: Immediate coverage across the entire platform (Scoping, Testing, Remediation, Admin Settings) with zero refactor overhead.
- **Alternative considered**: Creating a distinct `<NumericInput />` component. Rejected because it would require modifying dozens of pages and would fail to protect future inputs authored with `<Input type="number" />`.

### Decision 2: Focus Selection Handling & Browser Mouseup Protection
- **Chosen**: Immediate synchronous `target.select()` call, complemented by a `requestAnimationFrame` microtask fallback inside `handleFocus`.
- **Rationale**: In desktop Chromium/Safari browsers, clicking inside an input dispatches `focus` followed by `mouseup`. If the cursor position isn't stabilized, `mouseup` can clear the selection. Scheduling selection directly and via animation frame ensures the selection persists cleanly on both keyboard tab navigation and direct mouse clicks.

### Decision 3: Numeric Detection Heuristic
- **Chosen**: Detect `type === "number"`, `inputMode === "numeric" | "decimal"`, number type values, or currency patterns (`^(Rp\s?)?[-+]?\d+([.,]\d+)*%?$`).
- **Rationale**: Captures both native number inputs and text-wrapped currency/percent fields without falsely capturing regular descriptive text.

## Risks / Trade-offs

- **[Risk]** User clicking to edit a specific digit in the middle of a long number gets entire text selected on initial focus.
  → **Mitigation**: Standard spreadsheet/finance app convention (Excel, Google Sheets). Subsequent clicks inside an already-focused input place the caret normally without re-selecting.
