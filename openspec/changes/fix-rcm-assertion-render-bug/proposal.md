## Why

Currently, in the RCM TLC matrix page, the compliance columns (IPO and Assertions) render a checkmark (`✓`) or dash (`—`) using a boolean evaluation:
```typescript
render: (row) => row.assertionE ? '✓' : '—'
```
Since the database column type is `text` containing `'Y'` or `'N'`, the string values `'Y'` and `'N'` are both truthy in JavaScript/TypeScript. Consequently, the columns always display a checkmark (`✓`) even when the database value is `'N'` (not applicable/inactive).

Additionally, the user requested to simplify the UI styling by displaying the text indicator **`Y`** or **`N`** directly, instead of using checkmarks (`✓`) and dashes (`—`). This makes the sheet cleaner and easier to read as a spreadsheet.

## What Changes

- **Explicit Value Checking**: Modify the render logic of all IPO and Assertion columns in the RCM TLC Page table to explicitly check if the value equals `'Y'`.
- **Text Indicator (Y/N)**: Change the rendered indicators from `✓` (for yes) and `—` (for no) to `Y` and `N`.

## Capabilities

### Modified Capabilities
- `rcm-matrix`: Standardize value representation in the RCM TLC spreadsheet layout by replacing checkmarks/dashes with explicit `Y` and `N` characters.

## Impact

- **Frontend**: 
  - `src/pages/rcm/RCMTLCPage.tsx` will be modified to change how IPO (C, A, V, RA) and Assertions (E/O, C, A, CO, R&O, V/A, PD) are rendered.
  - No backend database or API schema changes are required.
