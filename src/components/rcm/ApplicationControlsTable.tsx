import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Layers, ExternalLink } from 'lucide-react';
import type { Control } from '@shared/types';

interface ControlsTableProps {
  controls: Control[];
  isLoading: boolean;
  emptyMessage: string;
  matrixType: 'tlc' | 'itgc';
}

export function ControlsTable({
  controls,
  isLoading,
  emptyMessage,
  matrixType,
}: ControlsTableProps) {
  const { t } = useTranslation(['rcm', 'common']);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
        <span>Loading controls...</span>
      </div>
    );
  }

  if (controls.length === 0) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-lg space-y-2">
        <Layers className="h-8 w-8 text-slate-300 mx-auto" />
        <p className="text-sm font-medium text-slate-600">{emptyMessage}</p>
        <p className="text-xs text-slate-400">
          Assign this application to controls in the BPM Editor or RCM Worksheet to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[120px] text-xs font-bold text-slate-700">Control ID</TableHead>
            <TableHead className="text-xs font-bold text-slate-700">Control Name & Description</TableHead>
            {matrixType === 'itgc' && (
              <TableHead className="w-[140px] text-xs font-bold text-slate-700">ITGC Domain</TableHead>
            )}
            <TableHead className="w-[110px] text-xs font-bold text-slate-700">Type</TableHead>
            <TableHead className="w-[110px] text-xs font-bold text-slate-700">Nature</TableHead>
            <TableHead className="w-[100px] text-xs font-bold text-slate-700">Frequency</TableHead>
            <TableHead className="w-[80px] text-center text-xs font-bold text-slate-700">Key</TableHead>
            <TableHead className="w-[110px] text-right text-xs font-bold text-slate-700">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {controls.map((ctrl) => (
            <TableRow key={ctrl.id} className="hover:bg-slate-50/60 transition-colors">
              <TableCell className="font-bold text-xs text-indigo-700 whitespace-nowrap">
                {ctrl.code}
              </TableCell>
              <TableCell className="space-y-0.5 max-w-[320px]">
                <div className="font-semibold text-xs text-slate-800 truncate">{ctrl.name}</div>
                {ctrl.description && (
                  <div className="text-[11px] text-slate-500 line-clamp-1">{ctrl.description}</div>
                )}
              </TableCell>
              {matrixType === 'itgc' && (
                <TableCell>
                  <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700">
                    {ctrl.itgcDomain || 'ITGC'}
                  </Badge>
                </TableCell>
              )}
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    ctrl.type === 'Preventive' || ctrl.type === 'Preventif'
                      ? 'bg-blue-50 text-blue-700 border-blue-200 text-[10px]'
                      : 'bg-amber-50 text-amber-700 border-amber-200 text-[10px]'
                  }
                >
                  {ctrl.type || '-'}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-slate-600 whitespace-nowrap">{ctrl.nature || '-'}</TableCell>
              <TableCell className="text-xs text-slate-600 whitespace-nowrap">{ctrl.frequency || '-'}</TableCell>
              <TableCell className="text-center">
                {ctrl.isKeyControl ? (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0 text-[10px] font-bold">
                    Key
                  </Badge>
                ) : (
                  <span className="text-slate-300 text-xs">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1 px-2"
                  onClick={() => {
                    const targetPath = matrixType === 'tlc' ? '/rcm/tlc' : '/rcm/itgc';
                    window.open(`${targetPath}?search=${encodeURIComponent(ctrl.code)}`, '_blank');
                  }}
                  title={t('rcm:application_detail.view_in_rcm')}
                >
                  <span>{t('rcm:application_detail.preview')}</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
