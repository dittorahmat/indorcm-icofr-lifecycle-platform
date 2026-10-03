import React from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Download } from 'lucide-react';

interface ReportExportPanelProps {
  onExport: (format: 'csv' | 'excel') => void;
}

export function ReportExportPanel({ onExport }: ReportExportPanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 no-print w-full sm:w-auto">
      <Button variant="outline" size="sm" onClick={() => onExport('excel')} className="gap-2 h-11 sm:h-9 min-h-[44px] sm:min-h-0 flex-1 sm:flex-none justify-center">
        <FileSpreadsheet className="h-4 w-4 text-green-600" /> Excel
      </Button>
      <Button variant="outline" size="sm" onClick={() => onExport('csv')} className="gap-2 h-11 sm:h-9 min-h-[44px] sm:min-h-0 flex-1 sm:flex-none justify-center">
        <Download className="h-4 w-4 text-blue-600" /> CSV
      </Button>
    </div>
  );
}
