## Why

When users interact with numeric and currency input fields across the platform (such as OM %, PM Haircut %, Significant Location count, or Deficiency Exposure value), fields default or currently evaluate to `0`. When a user clicks or tabs into the input and begins typing (e.g. typing `15`), the leading `0` is retained, resulting in confusing values like `015`. While saving normalizes the numeric representation, displaying `015` in the UI causes significant user confusion and friction.

## What Changes

- Enhance the platform's foundational input component (`src/components/ui/input.tsx`) to automatically select/highlight its entire value upon receiving focus (`onFocus`) whenever the input is numeric, currency, or decimal.
- Support `selectOnFocus` opt-in/opt-out prop while providing automatic detection for `type="number"`, `inputMode="numeric"`, `inputMode="decimal"`, number values, and currency strings.
- Retain existing non-numeric input behavior unchanged (plain text inputs, search bars, and text areas will not auto-select unless explicitly configured).
- Add automated unit test suite covering numeric focus selection, mouseup/event-loop resiliency, and non-numeric inputs.

## Capabilities

### New Capabilities
- `numeric-input-focus-selection`: Automatic full selection on focus for numeric and currency inputs to eliminate leading zero typing artifacts.

### Modified Capabilities
<!-- None -->

## Impact

- **UI Components**: `src/components/ui/input.tsx`
- **Testing**: `src/components/ui/input.test.tsx`
- **User Experience**: Immediate fix across all pages and modals (Scoping Materiality, Deficiency DoD Wizard, Control Testing, Baselining, etc.) without requiring per-page refactoring.
