import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { 
  detectRCMColumns, 
  filterEmptyRows,
  validateRCMMapping
} from '@/lib/compliance-utils';

export interface RCMParseResult {
  success: boolean;
  rows: any[];
  error?: string;
  missingColumns?: string[];
}

/**
 * Service to parse RCM data from CSV or Excel files.
 * Normalizes data into a structured format for migration.
 */
export async function parseRCMFile(file: File): Promise<RCMParseResult> {
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
        const mapping = detectRCMColumns(headers);
        const validation = validateRCMMapping(mapping);

        if (!validation.valid) {
          resolve({ 
            success: false, 
            rows: [], 
            error: 'Missing required columns. Ensure Entity_Code, No_GL (or FSLI), Process, Risk, and Control columns exist.', 
            missingColumns: validation.missing 
          });
          return;
        }

        const rows = filteredRaw.map((r: any) => {
          return {
            id: crypto.randomUUID(),
            entityCode: String(r[mapping.entityCode] || ''),
            accountCode: String(r[mapping.noGL] || ''),
            processName: String(r[mapping.processName] || ''),
            riskDescription: String(r[mapping.riskDescription] || ''),
            controlDescription: String(r[mapping.controlDescription] || ''),
            controlName: String(r[mapping.controlName] || r[mapping.controlDescription]?.substring(0, 50) || 'Control'),
            nature: String(r[mapping.nature] || 'Manual'),
            type: String(r[mapping.type] || 'Preventive'),
            frequency: String(r[mapping.frequency] || 'Ad-hoc'),
            guessedFields: ['type', 'nature', 'frequency'], // Since it's parsed, we can say we "guessed" defaults if missing
            confidence: { type: 1.0, nature: 1.0 }
          };
        }).filter(r => r.entityCode && r.riskDescription && r.controlDescription);

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
