import { useCallback, useState } from 'react';

/**
 * Single choke-point for all regulatory Excel exports.
 * Centralizes: isExporting state, dynamic import, filename fallback, error mapping.
 * Callers MUST NOT import 'xlsx' or '*excel-export' directly in .tsx —
 * use this hook so the 15+ duplicated handleExportExcel blocks collapse to one pattern.
 */
interface ExcelExportConfig<TRow> {
  rows: TRow[];
  filename: string;
  sheetName?: string;
  exportFn: (rows: TRow[], opts: { filename: string; sheetName?: string }) => void | Promise<void>;
  onError?: (error: unknown) => void;
}

export function useExcelExport<TRow>() {
  const [isExporting, setIsExporting] = useState(false);

  const exportNow = useCallback(async (config: ExcelExportConfig<TRow>) => {
    if (isExporting || config.rows.length === 0) return false;
    setIsExporting(true);
    try {
      await config.exportFn(config.rows, { filename: config.filename, sheetName: config.sheetName });
      return true;
    } catch (error) {
      config.onError?.(error);
      return false;
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  return { isExporting, exportNow };
}
