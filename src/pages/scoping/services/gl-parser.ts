import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { 
  parseBalance, 
  detectGLColumns, 
  filterEmptyRows,
  validateGLMapping,
  getWorkbookSheetsMeta,
  SheetMeta
} from '@/lib/compliance-utils';
import { GLRow } from '@shared/types';

export interface SheetCandidate {
  name: string;
  hidden: boolean;
  isValid: boolean;
  missingColumns: string[];
  rowCount: number;
}

export interface ParseResult {
  success: boolean;
  rows: GLRow[];
  error?: string;
  missingColumns?: string[];
  requiresSheetSelection?: boolean;
  sheets?: SheetCandidate[];
  selectedSheet?: string;
}

export interface ParseGLOptions {
  targetSheet?: string;
}

/**
 * Service to parse GL data from CSV or Excel files.
 * Supports hidden sheet filtering, automatic valid sheet detection, and interactive sheet fallback.
 */
export async function parseGLFile(file: File, options?: ParseGLOptions): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const bstr = e.target?.result;
      let rawData: any[] = [];
      let headers: string[] = [];

      try {
        if (file.name.endsWith('.csv')) {
          const results = Papa.parse(bstr as string, { 
            header: true, 
            skipEmptyLines: 'greedy', 
            transformHeader: (h) => h.trim(),
            delimitersToGuess: [',', ';', '\t', '|']
          });
          rawData = results.data;
          headers = results.meta.fields || [];

          const filteredRaw = filterEmptyRows(rawData);
          const mapping = detectGLColumns(headers);
          const validation = validateGLMapping(mapping);

          if (!validation.valid) {
            resolve({ 
              success: false, 
              rows: [], 
              error: 'Missing required columns', 
              missingColumns: validation.missing 
            });
            return;
          }

          const rows = buildGLRows(filteredRaw, mapping);
          if (rows.length === 0) {
            resolve({ success: false, rows: [], error: 'No valid data rows found' });
            return;
          }

          resolve({ success: true, rows });
        } else {
          const workbook = XLSX.read(bstr, { type: 'binary' });
          const sheetsMeta = getWorkbookSheetsMeta(workbook);
          const visibleSheets = sheetsMeta.filter(s => !s.hidden);

          // If targetSheet is explicitly passed, use that sheet
          if (options?.targetSheet) {
            const worksheet = workbook.Sheets[options.targetSheet];
            if (!worksheet) {
              resolve({ success: false, rows: [], error: `Sheet "${options.targetSheet}" not found in workbook` });
              return;
            }
            const json = XLSX.utils.sheet_to_json(worksheet);
            rawData = json.map((row: any) => {
              const trimmedRow: any = {};
              Object.keys(row).forEach(key => trimmedRow[key.trim()] = row[key]);
              return trimmedRow;
            });
            headers = rawData.length > 0 ? Object.keys(rawData[0]) : [];
            const filteredRaw = filterEmptyRows(rawData);
            const mapping = detectGLColumns(headers);
            const validation = validateGLMapping(mapping);

            if (!validation.valid) {
              resolve({
                success: false,
                rows: [],
                error: 'Missing required columns in selected sheet',
                missingColumns: validation.missing,
                selectedSheet: options.targetSheet
              });
              return;
            }

            const rows = buildGLRows(filteredRaw, mapping);
            resolve({ success: true, rows, selectedSheet: options.targetSheet });
            return;
          }

          // Evaluate candidate sheets across all visible sheets
          const sheetCandidates: SheetCandidate[] = visibleSheets.map(s => {
            const ws = workbook.Sheets[s.name];
            if (!ws) {
              return { name: s.name, hidden: s.hidden, isValid: false, missingColumns: ['accountName', 'balance'], rowCount: 0 };
            }
            const sampleJson = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
            const firstDataRow = sampleJson.find(r => r && r.length > 0 && r.some(cell => String(cell).trim() !== ''));
            const sheetHeaders = firstDataRow ? firstDataRow.map(c => String(c).trim()) : [];
            const mapping = detectGLColumns(sheetHeaders);
            const validation = validateGLMapping(mapping);
            const rowCount = Math.max(0, sampleJson.length - 1);

            return {
              name: s.name,
              hidden: s.hidden,
              isValid: validation.valid,
              missingColumns: validation.missing,
              rowCount
            };
          });

          const validCandidates = sheetCandidates.filter(c => c.isValid);

          // If exactly one visible sheet is valid, automatically pick it!
          if (validCandidates.length === 1) {
            const chosenSheetName = validCandidates[0].name;
            const worksheet = workbook.Sheets[chosenSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);
            rawData = json.map((row: any) => {
              const trimmedRow: any = {};
              Object.keys(row).forEach(key => trimmedRow[key.trim()] = row[key]);
              return trimmedRow;
            });
            headers = rawData.length > 0 ? Object.keys(rawData[0]) : [];
            const filteredRaw = filterEmptyRows(rawData);
            const mapping = detectGLColumns(headers);
            const rows = buildGLRows(filteredRaw, mapping);

            if (rows.length === 0) {
              resolve({ success: false, rows: [], error: 'No valid data rows found in sheet' });
              return;
            }

            resolve({ success: true, rows, selectedSheet: chosenSheetName });
            return;
          }

          // If multiple visible sheets are valid, or none are valid, request sheet selection
          resolve({
            success: false,
            rows: [],
            requiresSheetSelection: true,
            sheets: sheetCandidates,
            error: validCandidates.length === 0 
              ? 'Missing required columns in visible sheets' 
              : 'Multiple candidate sheets found'
          });
        }
      } catch (err: any) {
        console.error("Parse error:", err);
        resolve({ success: false, rows: [], error: err.message });
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  });
}

function buildGLRows(filteredRaw: any[], mapping: Record<string, string>): GLRow[] {
  return filteredRaw.map((r: any) => {
    const parsedBal = parseBalance(r[mapping.balance]);
    const parsedFsliBal = mapping.fsliBalance ? parseBalance(r[mapping.fsliBalance]) : { success: false, value: 0 };
    
    return {
      id: crypto.randomUUID(),
      organizationId: 'org-1',
      snapshotId: 'temp',
      ymd: String(r[mapping.period] || ''), 
      entityCode: String(r[mapping.entityCode] || ''),
      parentEntityCode: String(r[mapping.parentEntityCode] || ''),
      entityId: null,
      noGL: String(r[mapping.accountCode] || ''), 
      glDesc: String(r[mapping.accountName] || ''),
      currency: String(r[mapping.currency] || 'IDR'), 
      balance: parsedBal.success ? parsedBal.value : 0,
      fsliBalance: parsedFsliBal.success ? parsedFsliBal.value : null,
      fsliCode: String(r[mapping.fsliCode] || ''), 
      fsliName: String(r[mapping.fsliName] || ''),
      category: String(r[mapping.kategori] || ''), 
      subKategori: String(r[mapping.subKategori] || ''),
      noUrut: parseInt(String(r[mapping.noUrut] || '0')) || 0,
      assignedDepartmentIds: [],
      ownerAcceptance: null,
      mappingConfidence: 1.0
    };
  }).filter(r => r.glDesc || r.fsliName);
}
