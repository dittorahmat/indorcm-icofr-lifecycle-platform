import React from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Download } from 'lucide-react';

interface ReportExportPanelProps {
  onExport: (format: 'csv' | 'excel') => void;
}

export function ReportExportPanel({ onExport }: ReportExportPanelProps) {
  return (
    <div className="flex items-center gap-2 no-print">
      <Button variant="outline" size="sm" onClick={() => onExport('excel')} className="gap-2">
        <FileSpreadsheet className="h-4 w-4 text-green-600" /> Excel
      </Button>
      <Button variant="outline" size="sm" onClick={() => onExport('csv')} className="gap-2">
        <Download className="h-4 w-4 text-blue-600" /> CSV
      </Button>
    </div>
  );
}
