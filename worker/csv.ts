/**
 * Lightweight CSV parser/unparser for Cloudflare Workers
 *
 * Features:
 * - RFC4180-style handling of quoted fields, embedded commas/newlines, and escaped quotes ("")
 * - normalize CRLF to LF
 * - parseCsv supports header:true (maps rows to objects) and skipEmptyLines
 * - unparseCsv accepts array of objects (or arrays) and emits CSV with header by default
 *
 * Small, dependency-free, and suitable for typical CSV import/export needs in Workers.
 */
type ParseOptions = { header?: boolean; skipEmptyLines?: boolean };
type UnparseOptions = { header?: boolean };
function isEmptyRow(row: string[]): boolean {
  return row.every((cell) => cell === '' || cell === null || cell === undefined);
}
/**
 * Parse a CSV string into an array of rows or objects (when header: true).
 *
 * @param csv - the CSV string
 * @param options - { header?: boolean, skipEmptyLines?: boolean }
 * @returns { data: T[] } - typed array; when header=true T is Record<string,string>
 */
export function parseCsv<T = Record<string, string>>(csv: string, options: ParseOptions = {}): { data: T[] } {
  const { header = true, skipEmptyLines = true } = options;
  if (csv === '') return { data: [] as unknown as T[] };
  // Normalize line endings to LF
  const input = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows: string[][] = [];
  let curField = '';
  let curRow: string[] = [];
  let inQuotes = false;
  // Iterate char by char
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        const next = input[i + 1];
        if (next === '"') {
          // Escaped quote
          curField += '"';
          i++; // skip the next quote
        } else {
          // Closing quote
          inQuotes = false;
          // Do not append the closing quote
        }
      } else {
        // Any character (including newlines and commas) inside quotes is part of the field
        curField += ch;
      }
    } else {
      // Not in quotes
      if (ch === '"') {
        // Start of quoted field (may be quoted even in the middle of cell)
        inQuotes = true;
      } else if (ch === ',') {
        // Field separator
        curRow.push(curField);
        curField = '';
      } else if (ch === '\n') {
        // End of record
        curRow.push(curField);
        curField = '';
        rows.push(curRow);
        curRow = [];
      } else {
        // Regular character
        curField += ch;
      }
    }
  }
  // End of input - push remaining field/row
  // There may be a pending quoted field not properly closed; treat remaining as field content.
  curRow.push(curField);
  rows.push(curRow);
  // Optionally drop a trailing blank row added by a final newline
  // e.g., "a,b\n" will produce rows [["a","b"], [""]] => above logic prevents extra trailing empty row if handled correctly,
  // but we still handle skipEmptyLines below.
  // Apply skipEmptyLines
  const filtered = skipEmptyLines ? rows.filter((r) => !isEmptyRow(r)) : rows;
  if (header) {
    if (filtered.length === 0) return { data: [] as unknown as T[] };
    const headers = filtered[0].map((h) => (h === null || h === undefined ? '' : String(h)));
    const data: Record<string, string>[] = [];
    for (let r = 1; r < filtered.length; r++) {
      const row = filtered[r];
      // Map columns to headers
      const obj: Record<string, string> = {};
      for (let c = 0; c < headers.length; c++) {
        obj[headers[c]] = row[c] !== undefined && row[c] !== null ? String(row[c]) : '';
      }
      // If there are more columns than headers, add them as numeric keys
      if (row.length > headers.length) {
        for (let c = headers.length; c < row.length; c++) {
          obj[String(c)] = row[c] !== undefined && row[c] !== null ? String(row[c]) : '';
        }
      }
      data.push(obj);
    }
    return { data: data as unknown as T[] };
  } else {
    // Return raw rows (array of arrays)
    return { data: filtered as unknown as T[] };
  }
}
/**
 * Escape a single field for CSV output.
 * Quotes the field if it contains comma, newline, or quote.
 * Escapes quotes by doubling them.
 */
function escapeField(field: unknown): string {
  if (field === null || field === undefined) return '';
  const s = String(field);
  const mustQuote = s.includes(',') || s.includes('\n') || s.includes('"') || /^\s|\s$/.test(s);
  if (mustQuote) {
    const escaped = s.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return s;
}
/**
 * Unparse an array of objects (or arrays) into a CSV string.
 *
 * @param data - array of objects (records) or arrays
 * @param options - { header?: boolean } - default header=true
 * @returns CSV string
 */
export function unparseCsv(data: any[], options: UnparseOptions = {}): string {
  const { header = true } = options;
  if (!Array.isArray(data) || data.length === 0) {
    return header ? '\n' : '';
  }
  // If elements are arrays of primitives => simple join
  const first = data[0];
  const isArrayOfArrays = Array.isArray(first);
  const lines: string[] = [];
  if (isArrayOfArrays) {
    if (header) {
      // No clear header; skip header if arrays provided but header requested
      // Emit rows only
    }
    for (const row of data as any[][]) {
      const line = row.map((cell) => escapeField(cell)).join(',');
      lines.push(line);
    }
    return lines.join('\n');
  }
  // Treat as array of objects
  // Build header list: use keys from first object preserving order, then add any new keys found later
  const headerOrder: string[] = [];
  const seen = new Set<string>();
  for (const obj of data as Record<string, any>[]) {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      for (const k of Object.keys(obj)) {
        if (!seen.has(k)) {
          seen.add(k);
          headerOrder.push(k);
        }
      }
    }
  }
  if (header) {
    lines.push(headerOrder.map(escapeField).join(','));
  }
  for (const obj of data as Record<string, any>[]) {
    const row = headerOrder.map((k) => escapeField(obj && Object.prototype.hasOwnProperty.call(obj, k) ? obj[k] : ''));
    lines.push(row.join(','));
  }
  return lines.join('\n');
}