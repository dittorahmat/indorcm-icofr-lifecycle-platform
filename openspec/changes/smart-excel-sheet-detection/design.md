## Context

Currently, `gl-parser.ts` and `rcm-parser.ts` use `XLSX.read` and always access `workbook.Sheets[workbook.SheetNames[0]]`. In Excel workbooks with multiple worksheets or hidden sheets (e.g. `Hidden: 1`), this results in parsing the wrong sheet, causing false negative validation errors like `Missing required columns`.

## Goals / Non-Goals

**Goals:**
- Inspect `workbook.Workbook.Sheets` to identify hidden vs visible worksheets.
- Analyze all visible sheets to determine column validity against GL/TB requirements (`accountName` and `balance`).
- Auto-select the target worksheet when exactly one visible sheet satisfies GL requirements.
- Prompt users via a modal dialog if multiple visible candidate sheets are found or if no visible sheet clearly matches.
- Maintain seamless backwards-compatibility for CSV and single-sheet Excel files.

**Non-Goals:**
- Merging multiple worksheets together.
- Supporting legacy binary Excel (`.xls`) beyond standard XLSX parser capabilities.

## Decisions

### 1. Workbook Inspection & Hidden Sheet Filter
We will extract worksheet names along with their visibility status:
```ts
const sheetsMeta = (workbook.Workbook?.Sheets || []).map((s: any, idx: number) => ({
  name: s.name || workbook.SheetNames[idx],
  hidden: s.Hidden === 1 || s.Hidden === 2
}));
```
Visible sheets are those where `hidden !== true`.

### 2. Auto-Discovery vs Interactive Sheet Selection (Option C)
- If user supplies an explicit `options.targetSheet`, use it directly.
- Otherwise, evaluate headers of each visible sheet.
- If exactly one visible sheet has `valid === true` via `validateGLMapping`, auto-parse that sheet directly.
- If multiple visible sheets are valid, or none are valid, return `requiresSheetSelection: true` with sheet metadata (`name`, `rowCount`, `columnCount`, `isValid`, `missingColumns`).
- In `SmartImportWizard.tsx`, render an institutional modal for sheet selection when `requiresSheetSelection` is returned.

### Alternatives Considered
- *Always show sheet picker dialog*: Rejected because it adds friction for typical files where only one valid sheet exists.
- *Blind first sheet fallback*: Rejected because hidden or preface sheets frequently break the flow.

## Risks / Trade-offs

- **[Risk] Large workbook scanning performance** → *Mitigation*: Only read header rows (e.g. `sheet_to_json(..., { header: 1 })` limited to first few rows) during sheet evaluation, avoiding parsing millions of cells across every sheet.
