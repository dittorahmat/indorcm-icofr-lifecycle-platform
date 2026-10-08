import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link2, PlusCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BPMNodeOption, RCMImportParsedRow } from './rcm-import-types';

interface RCMReconciliationStepProps {
  rows: RCMImportParsedRow[];
  bpmNodes: BPMNodeOption[];
  onUpdateRowNodeLink: (rowId: string, targetNodeId?: string) => void;
  onAutoCreateNode: (rowId: string) => void;
}

export function RCMReconciliationStep({
  rows,
  bpmNodes,
  onUpdateRowNodeLink,
  onAutoCreateNode,
}: RCMReconciliationStepProps) {
  const { t } = useTranslation(['rcm', 'common', 'bpm']);

  const matchedCount = rows.filter((r) => r.matchStatus === 'matched').length;
  const suggestedCount = rows.filter((r) => r.matchStatus === 'suggested').length;
  const unmatchedCount = rows.filter((r) => !r.matchStatus || r.matchStatus === 'unmatched').length;

  return (
    <div className="space-y-4">
      {/* Banner Rekonsiliasi */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-border rounded-md">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold text-slate-800">
            {t('rcm:importWizard.reconciliationTitle', { defaultValue: 'Pemetaan Otomatis Kontrol ke Simpul BPM Diagram' })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
            {matchedCount} Matched
          </Badge>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
            {suggestedCount} Disarankan
          </Badge>
          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">
            {unmatchedCount} Unmapped
          </Badge>
        </div>
      </div>

      {/* Tabel Pemetaan */}
      <div className="border border-border rounded-md overflow-x-auto max-w-full touch-pan-x overscroll-x-contain min-w-0 max-h-80">
        <Table className="min-w-[760px]">
          <TableHeader className="bg-slate-50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-10 text-xs font-bold">Status</TableHead>
              <TableHead className="text-xs font-bold">Kode & Nama Kontrol</TableHead>
              <TableHead className="text-xs font-bold">Langkah Alur RCM</TableHead>
              <TableHead className="text-xs font-bold min-w-[260px]">Target Simpul BPM Canvas</TableHead>
              <TableHead className="w-24 text-xs font-bold text-right">Aksi Cepat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    {row.matchStatus === 'matched' && (
                      <span title="Matched">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </span>
                    )}
                    {row.matchStatus === 'suggested' && (
                      <span title="Disarankan">
                        <HelpCircle className="h-4 w-4 text-amber-600" />
                      </span>
                    )}
                    {(!row.matchStatus || row.matchStatus === 'unmatched') && (
                      <span className="h-2 w-2 rounded-full bg-slate-300 block" title="Belum Dipetakan" />
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    <p className="font-semibold text-slate-800 truncate max-w-[200px]">{row.controlName}</p>
                    <p className="text-muted-foreground font-mono text-[11px]">{row.controlCode || '-'}</p>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-600">
                    {row.bpmNodeRef || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-xs">
                    <select
                      value={row.targetBpmNodeId || ''}
                      onChange={(e) => onUpdateRowNodeLink(row.id, e.target.value || undefined)}
                      className="w-full text-xs bg-background border border-input rounded-md px-2 py-1.5 h-8 font-medium focus:ring-1 focus:ring-ring"
                    >
                      <option value="">(Simpan di Unmapped Palette)</option>
                      {bpmNodes.map((node) => (
                        <option key={node.id} value={node.id}>
                          [{node.type.toUpperCase()}] {node.label}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAutoCreateNode(row.id)}
                      className="h-8 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      title="Buat Simpul Baru di Canvas"
                    >
                      <PlusCircle className="h-3.5 w-3.5 mr-1" /> Buat Node
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
