import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { RCMFlavor, RCMImportParsedRow } from './rcm-import-types';
import { summarizeRcmRows } from './rcm-ingestion';

interface RCMValidationStepProps {
  flavor: RCMFlavor;
  rows: RCMImportParsedRow[];
}

export function RCMValidationStep({ flavor, rows }: RCMValidationStepProps) {
  const { t } = useTranslation(['rcm', 'common']);
  const { invalidRowCount: invalidCount } = summarizeRcmRows(rows);
  const validCount = rows.length - invalidCount;

  return (
    <div className="space-y-4">
      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-slate-50 border border-border rounded-md">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Baris</p>
          <p className="text-xl font-bold text-slate-800">{rows.length}</p>
        </div>
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md">
          <p className="text-xs text-emerald-700 uppercase font-bold tracking-wider flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Valid
          </p>
          <p className="text-xl font-bold text-emerald-800">{validCount}</p>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-xs text-amber-700 uppercase font-bold tracking-wider flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" /> Membutuhkan Perhatian
          </p>
          <p className="text-xl font-bold text-amber-800">{invalidCount}</p>
        </div>
      </div>

      {/* Preview Table */}
      <div className="border border-border rounded-md overflow-x-auto max-w-full touch-pan-x overscroll-x-contain min-w-0 max-h-72">
        <Table className="min-w-[700px]">
          <TableHeader sticky className="bg-slate-50 dark:bg-card">
            <TableRow>
              <TableHead className="w-12 text-xs font-bold">Status</TableHead>
              <TableHead className="text-xs font-bold">Sub-proses</TableHead>
              {flavor === 'TLC' && <TableHead className="text-xs font-bold">Ref BPM</TableHead>}
              <TableHead className="text-xs font-bold">Risiko</TableHead>
              <TableHead className="text-xs font-bold">Kode Kontrol</TableHead>
              <TableHead className="text-xs font-bold">Nama Aktivitas Kontrol</TableHead>
              <TableHead className="text-xs font-bold">Tipe / Sifat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className={!row.isValid ? 'bg-amber-50/40' : undefined}>
                <TableCell>
                  {row.isValid ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-medium">
                      OK
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs font-medium">
                      Error
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs font-medium max-w-[140px] truncate">{row.subProcessName}</TableCell>
                {flavor === 'TLC' && (
                  <TableCell className="text-xs font-mono font-medium text-slate-600">
                    {row.bpmNodeRef || '-'}
                  </TableCell>
                )}
                <TableCell className="text-xs max-w-[180px] truncate">{row.riskDescription}</TableCell>
                <TableCell className="text-xs font-mono font-semibold text-slate-700">{row.controlCode || 'Auto'}</TableCell>
                <TableCell className="text-xs font-medium max-w-[200px] truncate">{row.controlName}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {row.controlType} / {row.controlNature}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
