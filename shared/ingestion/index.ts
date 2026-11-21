/**
 * Deep ingestion module for General Ledger and RCM workbooks.
 * Encapsulates column detection, sheet metadata discovery, row filtering, balance parsing, and quality scoring.
 */

export interface SheetMeta {
  name: string;
  hidden: boolean;
  visibilityType?: 'visible' | 'hidden' | 'veryHidden';
}

interface WorkbookSheetMeta {
  name?: string;
  Hidden?: number;
  hidden?: number;
}

interface WorkbookLike {
  Workbook?: { Sheets?: WorkbookSheetMeta[] };
  SheetNames?: string[];
}

export function getWorkbookSheetsMeta(workbook: WorkbookLike): SheetMeta[] {
  const wbSheets = workbook.Workbook?.Sheets || [];
  const sheetNames = workbook.SheetNames || [];

  return sheetNames.map((name, index) => {
    const meta = wbSheets[index] || {};
    const hiddenVal = meta.Hidden ?? meta.hidden ?? 0;
    const hidden = hiddenVal > 0;
    return {
      name,
      hidden,
      visibilityType: hiddenVal === 2 ? 'veryHidden' : hidden ? 'hidden' : 'visible',
    };
  });
}

export function filterEmptyRows<T extends Record<string, unknown>>(rows: T[]): T[] {
  return rows.filter((row) =>
    Object.values(row).some(
      (val) => val !== null && val !== undefined && String(val).trim() !== ''
    )
  );
}

export function parseBalance(value: string | number): { success: boolean; value: number; error?: string } {
  if (typeof value === 'number') {
    return { success: true, value };
  }

  if (!value || value.trim() === '' || value === '-') {
    return { success: true, value: 0 };
  }

  let cleaned = value.trim();
  const isNegative = cleaned.startsWith('(') && cleaned.endsWith(')');
  if (isNegative) {
    cleaned = cleaned.slice(1, -1);
  }

  cleaned = cleaned.replace(/\s/g, '');
  cleaned = cleaned.replace(/\./g, '');
  cleaned = cleaned.replace(',', '.');

  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) {
    return { 
      success: false, 
      value: 0, 
      error: `Invalid balance format: ${value}` 
    };
  }

  return { 
    success: true, 
    value: isNegative ? -parsed : parsed 
  };
}

export const GL_COLUMN_MAPPING = {
  accountCode: ['No_GL', 'Kode_GL', 'AccountCode', 'Account Code', 'Code'],
  accountName: ['GL_Desc', 'GLDesc', 'AccountName', 'Account Name', 'Account', 'Description'],
  balance: ['GL_Balance', 'GLBalance', 'Balance', 'Amount', 'EndingBalance', 'Saldo'],
  fsliCode: ['Kode_FSLI', 'FSLICode', 'FSLI_Code'],
  entityCode: ['Kode_Entity', 'EntityCode', 'Entity_Code', 'Kode_Cabang'],
  parentEntityCode: ['Parent_Entity', 'ParentEntity', 'Parent_Code', 'Induk_Entitas'],
  currency: ['Kode_Valuta', 'Currency', 'Valuta', 'Curr'],
  period: ['YMD', 'Date', 'Period', 'Tanggal'],
  kategori: ['Kategori', 'Category'],
  subKategori: ['Sub_Kategori', 'SubKategori', 'Sub-Category'],
  fsliName: ['FSLI', 'FSLI_Name', 'FSLIName'],
  fsliBalance: ['FSLI_Balance', 'FSLIBalance', 'Saldo_FSLI', 'Saldo FSLI'],
  noUrut: ['No_Urut', 'No_U', 'NoUrut', 'SortOrder'],
} as const;

export type GLField = keyof typeof GL_COLUMN_MAPPING;

export function detectGLColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  headers.forEach((header) => {
    const trimmedHeader = header.trim().toLowerCase();
    
    (Object.keys(GL_COLUMN_MAPPING) as GLField[]).forEach((field) => {
      if (mapping[field]) return;
      const variations = GL_COLUMN_MAPPING[field] as readonly string[];
      const match = variations.find((v) => v.toLowerCase() === trimmedHeader);
      if (match) {
        mapping[field] = header.trim();
      }
    });
  });

  return mapping;
}

export function validateGLMapping(mapping: Record<string, string>): { valid: boolean; missing: string[] } {
  const required = ['accountName', 'balance'];
  const missing = required.filter((field) => !mapping[field]);
  return {
    valid: missing.length === 0,
    missing,
  };
}

export function calculateDataQualityScore(
  totalRows: number,
  emptyAccounts: number,
  emptyNames: number,
  zeroBalances: number
): { score: number; status: 'EXCELLENT' | 'GOOD' | 'NEEDS_REVIEW' | 'CRITICAL'; notes: string[] } {
  if (totalRows === 0) return { score: 0, status: 'CRITICAL', notes: ['Dataset is completely empty'] };

  let score = 100;
  const notes: string[] = [];

  const emptyAccountPct = (emptyAccounts / totalRows) * 100;
  if (emptyAccountPct > 0) {
    const penalty = Math.min(40, emptyAccountPct * 2);
    score -= penalty;
    notes.push(`${emptyAccounts} rows (${Math.round(emptyAccountPct)}%) missing Account Number`);
  }

  const emptyNamePct = (emptyNames / totalRows) * 100;
  if (emptyNamePct > 0) {
    const penalty = Math.min(30, emptyNamePct * 1.5);
    score -= penalty;
    notes.push(`${emptyNames} rows (${Math.round(emptyNamePct)}%) missing Account Name`);
  }

  const zeroBalancePct = (zeroBalances / totalRows) * 100;
  if (zeroBalancePct > 50) {
    score -= 10;
    notes.push(`High proportion of zero balances (${Math.round(zeroBalancePct)}%)`);
  }

  const finalScore = Math.max(0, Math.round(score));
  let status: 'EXCELLENT' | 'GOOD' | 'NEEDS_REVIEW' | 'CRITICAL' = 'EXCELLENT';
  if (finalScore < 50) status = 'CRITICAL';
  else if (finalScore < 75) status = 'NEEDS_REVIEW';
  else if (finalScore < 90) status = 'GOOD';

  return { score: finalScore, status, notes };
}
