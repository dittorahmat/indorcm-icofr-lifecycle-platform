import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { 
  parseBalance, 
  detectGLColumns, 
  filterEmptyRows,
  validateGLMapping
} from '@/lib/compliance-utils';
import { GLRow } from '@shared/types';

export interface ParseResult {
  success: boolean;
  rows: GLRow[];
  error?: string;
  missingColumns?: string[];
}

/**
 * Service to parse GL data from CSV or Excel files.
 * Normalizes data into a standardized GLRow format.
 */
export async function parseGLFile(file: File): Promise<ParseResult> {
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
        } else {
          const workbook = XLSX.read(bstr, { type: 'binary' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(worksheet);
          rawData = json.map((row: any) => {
            const trimmedRow: any = {};
            Object.keys(row).forEach(key => trimmedRow[key.trim()] = row[key]);
            return trimmedRow;
          });
          headers = rawData.length > 0 ? Object.keys(rawData[0]) : [];
        }

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

        const rows: GLRow[] = filteredRaw.map((r: any) => {
          const parsedBal = parseBalance(r[mapping.balance]);
          return {
            id: crypto.randomUUID(),
            organizationId: 'org-1', // Placeholder, set by backend usually
            snapshotId: 'temp',
            ymd: String(r[mapping.period] || ''), 
            entityCode: String(r[mapping.entityCode] || ''),
            noGL: String(r[mapping.accountCode] || ''), 
            glDesc: String(r[mapping.accountName] || ''),
            currency: String(r[mapping.currency] || 'IDR'), 
            balance: parsedBal.success ? parsedBal.value : 0,
            fsliCode: String(r[mapping.fsliCode] || ''), 
            fsliName: String(r[mapping.fsliName] || ''),
            category: String(r[mapping.kategori] || ''), 
            subKategori: String(r[mapping.subKategori] || ''),
            noUrut: parseInt(String(r[mapping.noUrut] || '0')) || 0,
            assignedDepartmentIds: [],
            ownerAcceptance: null
          };
        }).filter(r => r.glDesc);

        if (rows.length === 0) {
          resolve({ success: false, rows: [], error: 'No valid data rows found' });
          return;
        }

        resolve({ success: true, rows });
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
