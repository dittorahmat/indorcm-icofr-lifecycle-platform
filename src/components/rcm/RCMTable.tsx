import React from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ShieldAlert, Edit2, ChevronRight, Layers, FileText } from 'lucide-react';

export interface RCMColumn {
  id: string;
  header: string;
  accessorKey?: string;
  width: string;
  className?: string;
  headerClassName?: string;
  tooltip?: string;
  render?: (row: any, index: number) => React.ReactNode;
}

export interface RCMColumnGroup {
  title: string;
  columns: RCMColumn[];
  className?: string;
}

interface RCMTableProps {
  groups: RCMColumnGroup[];
  data: any[];
  isLoading?: boolean;
  onEdit?: (row: any) => void;
  renderGroupRow?: (row: any, index: number, prevRow?: any) => React.ReactNode;
  rowClassName?: (row: any, index: number) => string;
  minWidth?: string;
}

export function RCMTable({ 
  groups, 
  data, 
  isLoading, 
  onEdit, 
  renderGroupRow,
  rowClassName,
  minWidth = "2000px" 
}: RCMTableProps) {
  const { t } = useTranslation(['rcm', 'common']);

  const allColumns = groups.flatMap(g => g.columns);

  return (
    <TooltipProvider>
      {/* 
          Wrapper div must have overflow-auto and a defined height (via flex-1 min-h-0 in a flex-col parent)
          to enable vertical sticky headers on desktop, and a clean card feed on mobile.
      */}
      <div className="w-full max-w-full border-t border-b bg-slate-50/50 md:bg-white border-slate-300 scrollbar-hover flex-1 min-h-0 relative overflow-auto touch-pan-x overscroll-x-contain">
        {/* Desktop View: Wide Table with Frozen Sticky Headers (md and up) */}
        <div className="hidden md:block w-full">
          <table 
            className="table-fixed border-separate border-spacing-0 mb-10 w-full"
            style={{ minWidth }}
          >
            <thead className="z-30">
              {/* Level 1 Header: Groups */}
              <tr className="h-9 bg-slate-800 text-slate-100 sticky top-0 z-30 border-b border-slate-700">
                {groups.map((group, gIdx) => (
                  <th 
                    key={`group-${gIdx}`}
                    colSpan={group.columns.length}
                    className={cn(
                      "text-center font-semibold uppercase text-xs tracking-wider border-r border-slate-700 py-1.5 px-3",
                      group.className
                    )}
                  >
                    {group.title}
                  </th>
                ))}
              </tr>

              {/* Level 2 Header: Columns */}
              <tr className="h-11 bg-slate-100 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-700 sticky top-[36px] z-20">
                {allColumns.map((col, cIdx) => (
                  <th 
                    key={`col-${col.id}-${cIdx}`}
                    className={cn(
                      "font-semibold uppercase text-xs px-3 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 align-middle bg-slate-100 dark:bg-slate-900",
                      col.headerClassName
                    )}
                    style={{ 
                      width: col.width
                    }}
                  >
                    <div className="flex flex-col items-center justify-center gap-1">
                      {col.tooltip ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help flex items-center justify-center hover:text-indigo-600 transition-colors">
                              {col.header}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[300px] bg-slate-900 text-white p-3 border border-slate-700 shadow-xl rounded-lg z-[100]">
                             <div className="text-xs leading-relaxed font-normal">
                                {col.tooltip}
                             </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : col.header}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {isLoading ? (
                <tr><td colSpan={allColumns.length} className="h-64 text-center font-semibold uppercase text-xs text-slate-400 tracking-wider">Loading matrix data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={allColumns.length} className="h-64 text-center text-xs text-slate-500">No RCM data found.</td></tr>
              ) : data.map((row, idx) => {
                const groupRow = renderGroupRow?.(row, idx, data[idx - 1]);
                const isEven = idx % 2 === 1;
                const rowBg = isEven ? "bg-slate-50/80" : "bg-white";

                return (
                  <React.Fragment key={`${row.mappingId || row.id || 'row'}-${idx}`}>
                    {groupRow}
                    <tr className={cn(
                      "group transition-all border-b border-slate-200 h-14 relative hover:z-10",
                      rowBg,
                      rowClassName?.(row, idx)
                    )}>
                      {allColumns.map((col, cIdx) => {
                        return (
                          <td 
                            key={`cell-${col.id}-${cIdx}`}
                            className={cn(
                              "px-3 border-r border-slate-100 py-2 text-xs transition-colors duration-200",
                              "group-hover:bg-indigo-50/70 group-hover:border-indigo-100/50",
                              col.className
                            )}
                          >
                            {col.render ? col.render(row, idx) : (row[col.accessorKey as string] || '-')}
                            {/* Row Indicator Accent */}
                            {cIdx === 0 && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Vertical Card Feed (hidden on md and up) */}
        <div className="md:hidden p-3.5 space-y-3 pb-24">
          {isLoading ? (
            <div className="p-8 text-center bg-white rounded-lg border border-slate-200 shadow-sm text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('common:status.pending', { defaultValue: 'Loading' })}...
            </div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-lg border border-slate-200 shadow-sm text-xs font-medium text-slate-500">
              {t('common:status.noData', { defaultValue: 'Tidak ada data RCM.' })}
            </div>
          ) : (
            data.map((row, idx) => {
              const controlCode = row.controlCode || row.code || '-';
              const controlName = row.mappedControlName || row.baseControlName || row.name || '-';
              const processName = row.subProcessName || row.processName || row.businessProcess || '-';
              const riskDesc = row.riskDescription || row.risk || row.description || '';
              const nature = row.controlNature || row.nature || 'Manual';
              const riskRating = row.riskRating || row.riskLevel || 'Medium';
              const isKey = Boolean(row.isKeyControl || row.isKey);

              return (
                <div 
                  key={`mobile-card-${row.mappingId || row.id || idx}`}
                  className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-3 transition-shadow hover:shadow-md"
                >
                  {/* Card Header: Code, Badges, and Action Button */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200">
                          {controlCode}
                        </span>
                        {isKey && (
                          <Badge className="bg-indigo-600 text-white font-semibold text-xs h-5 px-1.5 rounded">
                            Key Control
                          </Badge>
                        )}
                        <Badge 
                          variant="outline"
                          className={cn(
                            "text-xs font-medium h-5 px-1.5 rounded uppercase tracking-wider",
                            riskRating === 'High' ? "bg-rose-50 text-rose-700 border-rose-200" :
                            riskRating === 'Low' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            "bg-amber-50 text-amber-700 border-amber-200"
                          )}
                        >
                          {riskRating}
                        </Badge>
                      </div>
                      <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">
                        {controlName}
                      </p>
                    </div>

                    {onEdit && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(row)}
                        aria-label={`Edit ${controlCode}`}
                        className="h-9 min-h-[44px] min-w-[44px] px-2.5 gap-1 shrink-0 text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-bold text-xs"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </Button>
                    )}
                  </div>

                  {/* Card Body: Process and Risk info */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Layers className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="font-medium truncate">{processName}</span>
                    </div>
                    {riskDesc && (
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-100 text-slate-700 leading-relaxed font-normal">
                        <span className="font-semibold text-slate-900 mr-1">{t('matrix.risk', { defaultValue: 'Risiko' })}:</span>
                        {riskDesc}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Metadata (Nature, Frequency, Status) */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500 flex-wrap gap-2">
                    <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      {nature}
                    </span>
                    <span className="font-medium text-slate-600">
                      {row.frequency || 'Periodic'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
