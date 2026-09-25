## Why

When users upload Excel (.xlsx) files containing multiple worksheets into the Smart Migration Workspace (or GL/TB upload), the parser currently hardcodes reading the first worksheet (`workbook.Sheets[workbook.SheetNames[0]]`). This fails with `TB Parse Error: Missing required columns` if the first sheet is a cover, summary, or hidden sheet, even when a subsequent sheet contains complete and compliant Trial Balance data. In particular, Excel workbooks often contain hidden sheets (e.g. `Hidden: 1`) that users cannot see in Excel.

## What Changes

- **Hidden Sheet Filtering**: Automatically inspect `wb.Workbook?.Sheets` metadata and exclude hidden sheets (`Hidden: 1` or `veryHidden: 2`) from automatic scanning.
- **Smart Sheet Auto-Detection**: Inspect headers across all visible sheets against required and optional GL/TB columns using `detectGLColumns` and `validateGLMapping`. If exactly one visible sheet satisfies mandatory GL columns (`accountName` and `balance`), automatically parse that sheet without interrupting the user.
- **Sheet Selection Fallback Modal**: If multiple visible sheets are valid candidates or if no visible sheet is definitively valid, prompt the user with a modal dialog allowing them to inspect and select the intended worksheet.
- **Support for RCM Multi-Sheet**: Align `rcm-parser.ts` to also ignore hidden sheets and locate the valid worksheet containing control matrix columns.

## Capabilities

### Modified Capabilities
- `gl-integration`: Support multi-sheet Excel files with hidden sheet exclusion, automatic valid sheet detection, and interactive sheet selection fallback.

## Impact

- `src/pages/scoping/services/gl-parser.ts`: Refactor to scan visible sheets, auto-select the best match, or return sheet selection candidates.
- `src/pages/scoping/services/rcm-parser.ts`: Apply visible sheet filtering and smart sheet detection.
- `src/components/scoping/SmartImportWizard.tsx`: Add sheet selection dialog handling when user selection is required.
- `src/lib/compliance-utils.ts`: Provide helper utilities to inspect sheet visibility and score sheet column completeness.
