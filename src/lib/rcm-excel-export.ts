import * as XLSX from 'xlsx';

export interface RCMExportOptions {
  sheetName?: string;
  matrixType?: 'TLC' | 'ELC' | 'ITGC';
  filename?: string;
}

/**
 * Maps raw matrix data rows into clean, human-readable audit spreadsheet columns
 */
export function exportRCMToExcel(data: any[], options: RCMExportOptions = {}) {
  const {
    matrixType = 'TLC',
    sheetName = `${matrixType} Matrix`,
    filename = `RCM_${matrixType}_Matrix_${new Date().toISOString().split('T')[0]}.xlsx`
  } = options;

  const rows = data.map((item, index) => {
    const parentProcess = item.parentProcessName || item.processName || '-';
    const subProcess = item.subProcessName || item.subProcess || '-';

    if (matrixType === 'ELC') {
      return {
        'No': index + 1,
        'COSO Component': item.cosoComponent || '-',
        'COSO Principle': item.cosoPrinciple || '-',
        'Control Code': item.code || item.controlCode || '-',
        'Control Name': item.mappedControlName || item.name || '-',
        'Control Description': item.mappedControlDescription || item.description || '-',
        'Supporting Documents': item.supportingDocs || '-',
        'Key Control': item.isKeyControl ? 'Y' : 'N',
        'Frequency': item.frequency || '-',
        'Control Type': item.type || item.controlType || '-',
        'Control Nature': item.nature || item.controlNature || '-',
        'Executing Function': item.executingFunction || '-',
        'Executor Role': item.executorRole || '-',
        'Company': item.companyName || '-',
        'Effective Period': item.effectivePeriod || '-'
      };
    }

    if (matrixType === 'ITGC') {
      return {
        'No': index + 1,
        'Domain ITGC': item.itgcDomain || '-',
        'Process Information': parentProcess,
        'Sub Process': subProcess,
        'Risk Description': item.riskDescription || '-',
        'Risk Rating': item.riskRating || '-',
        'Control Code': item.controlCode || item.code || '-',
        'Control Name': item.mappedControlName || item.baseControlName || item.name || '-',
        'Control Description': item.mappedControlDescription || item.baseControlDescription || item.description || '-',
        'Supporting Documents': item.supportingDocs || '-',
        'Key Control': item.isKeyControl ? 'Y' : 'N',
        'Control Type': item.controlType || '-',
        'Control Nature': item.controlNature || '-',
        'Automated Type': item.automatedSubNature || '-',
        'Frequency': item.frequency || '-',
        'Supporting App': item.supportingApp || '-',
        'Executing Function': item.executingFunction || '-',
        'Executor Role': item.executorRole || '-',
        'Company': item.companyName || '-',
        'Effective Period': item.effectivePeriod || '-'
      };
    }

    // Default: TLC Matrix
    return {
      'No': index + 1,
      'Proses Bisnis (Parent)': item.parentBpmCode ? `${parentProcess} [${item.parentBpmCode}]` : parentProcess,
      'Sub-Proses (Child)': subProcess,
      'FSLI': item.fsliName || '-',
      'No GL': item.noGL || '-',
      'Company': item.companyName || '-',
      'Location': item.locationCode || '-',
      'Risk Description': item.riskDescription || '-',
      'Fraud': item.isFraudRelated ? 'Y' : 'N',
      'Risk Rating': item.riskRating || '-',
      'Control Code': item.controlCode || item.code || '-',
      'Control Name': item.mappedControlName || item.baseControlName || item.name || '-',
      'Control Description': item.mappedControlDescription || item.baseControlDescription || item.description || '-',
      'Supporting Documents': item.supportingDocs || '-',
      'Key Control': item.isKeyControl ? 'Y' : 'N',
      // IPO
      'IPO - C': item.ipoC === 'Y' ? 'Y' : 'N',
      'IPO - A': item.ipoA === 'Y' ? 'Y' : 'N',
      'IPO - V': item.ipoV === 'Y' ? 'Y' : 'N',
      'IPO - RA': item.ipoRa === 'Y' ? 'Y' : 'N',
      // Assertions
      'Assertion - E/O': item.assertionE === 'Y' ? 'Y' : 'N',
      'Assertion - C': item.assertionC === 'Y' ? 'Y' : 'N',
      'Assertion - A': item.assertionA === 'Y' ? 'Y' : 'N',
      'Assertion - CO': item.assertionCo === 'Y' ? 'Y' : 'N',
      'Assertion - R&O': item.assertionRo === 'Y' ? 'Y' : 'N',
      'Assertion - V/A': item.assertionVa === 'Y' ? 'Y' : 'N',
      'Assertion - PD': item.assertionPd === 'Y' ? 'Y' : 'N',
      // Control Attributes
      'Control Type': item.controlType || '-',
      'Control Nature': item.controlNature || '-',
      'Automated Type': item.automatedSubNature || '-',
      'Frequency': item.frequency || '-',
      'Supporting App': item.supportingApp || '-',
      'Executing Function': item.executingFunction || '-',
      'Executor Role': item.executorRole || '-',
      'Affected FSLI': item.affectedFsliItem || '-',
      'Effective Period': item.effectivePeriod || '-'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

// ---------------------------------------------------------------------------
// Shared regulatory export builder (Lampiran 6/7a/8/9/10/11, WBS, TOD/TOE)
// Layout per spec: title rows -> identity -> blank -> group row -> header -> data
// Callers pass already-filtered rows and locale-resolved headers.
// ---------------------------------------------------------------------------

export interface RegulatoryExportColumn {
  /** Key into each row record. */
  key: string;
  /** Already-localized column header text. */
  header: string;
  /** When true, numeric values are kept as numbers (summable in Excel). */
  numeric?: boolean;
}

export interface RegulatoryExportGroup {
  /** Group label placed at the group's first column (e.g. "Data Defisiensi (i - vi)"). */
  label: string;
  /** How many consecutive columns this group spans. */
  span: number;
}

export interface RegulatoryExportOptions {
  /** e.g. "LAMPIRAN 10". */
  title: string;
  /** Full document subtitle. */
  subtitle?: string;
  /** Identity lines, e.g. ["PT Bukit Asam Tbk", "Periode 2025"]. Cells stay plain text for manual completion. */
  identityLines?: string[];
  /** Optional group-header row; spans are laid out left-to-right over the columns. */
  groups?: RegulatoryExportGroup[];
  columns: RegulatoryExportColumn[];
  filename: string;
  sheetName?: string;
}

export const REGULATORY_EMPTY_CELL = '-';

/** Pure AoA builder — no xlsx dependency, fully unit-testable. */
export function buildRegulatoryAoA(
  rows: Array<Record<string, unknown>>,
  options: RegulatoryExportOptions,
): unknown[][] {
  const { title, subtitle, identityLines = [], groups = [], columns } = options;
  const aoa: unknown[][] = [];

  aoa.push([title]);
  if (subtitle) aoa.push([subtitle]);
  for (const line of identityLines) aoa.push([line]);
  aoa.push([]);

  if (groups.length > 0) {
    const groupRow: unknown[] = new Array(columns.length).fill('');
    let cursor = 0;
    for (const group of groups) {
      if (cursor < columns.length && group.span > 0) {
        groupRow[cursor] = group.label;
        cursor += group.span;
      }
    }
    aoa.push(groupRow);
  }

  aoa.push(columns.map((c) => c.header));

  for (const row of rows) {
    aoa.push(
      columns.map((col) => {
        const value = row[col.key];
        if (value === null || value === undefined || value === '') return REGULATORY_EMPTY_CELL;
        if (col.numeric && typeof value === 'number' && Number.isFinite(value)) return value;
        return value;
      }),
    );
  }

  return aoa;
}

/** Writes a single-table, single-sheet workbook. Lazy-loads xlsx at click time. */
export async function exportRegulatoryTableToExcel(
  rows: Array<Record<string, unknown>>,
  options: RegulatoryExportOptions,
): Promise<void> {
  const { filename, sheetName = 'Lampiran' } = options;
  const XLSX = await import('xlsx');
  const aoa = buildRegulatoryAoA(rows, options);
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

export interface SimpleTableExportOptions {
  filename: string;
  sheetName?: string;
}

/**
 * Generic single-sheet writer for plain keyed-row exports (e.g. GL scoping grid).
 * .tsx callers MUST use this via useExcelExport — never `import * as XLSX` directly.
 * Lazy-loads xlsx at click time so it stays out of the initial bundle.
 */
export async function exportSimpleTableToExcel(
  rows: Array<Record<string, unknown>>,
  options: SimpleTableExportOptions,
): Promise<void> {
  const { filename, sheetName = 'Sheet1' } = options;
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}
