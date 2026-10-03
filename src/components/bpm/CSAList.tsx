import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Eye, Printer, FileText, LayoutDashboard, Trash2, RefreshCw, Plus, FileSpreadsheet, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { CSARecord } from '@shared/types';
import { formatCsaReference } from '@/lib/csa-utils';

interface CSAListProps {
  items: CSARecord[];
  isLoading: boolean;
  onViewDetail: (id: string) => void;
  onDelete: (id: string) => void;
  onPrint: (id: string, layout: 'detailed' | 'summary') => void;
  onExcel?: (id: string, layout: 'detailed' | 'summary') => void;
  exportingId?: string | null;
  onNewAssessment: () => void;
  bpmCode?: string;
  noGL?: string;
  bpmProcessId?: string;
  year?: string | number;
}

export function CSAList({ 
  items, 
  isLoading, 
  onViewDetail, 
  onDelete, 
  onPrint, 
  onExcel,
  exportingId,
  onNewAssessment,
  bpmCode,
  noGL,
  bpmProcessId,
  year
}: CSAListProps) {
  const { t } = useTranslation();

  const formatReference = (item: CSARecord) => formatCsaReference({
    bpmCode,
    noGL,
    bpmProcessId: item.bpmProcessId || bpmProcessId,
    year: year || new Date(item.assessmentDate).getFullYear(),
    period: item.period
  });

  const formatDateTime = (ts: number | string) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const renderPrintMenu = (item: CSARecord, triggerClassName: string, label: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={label}
          className={triggerClassName}
        >
          <Printer className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="text-xs font-bold gap-2 cursor-pointer" onClick={() => onPrint(item.id, 'detailed')}>
          <FileText className="h-3.5 w-3.5" /> {t('csa_hub:history.exportDetailed', { defaultValue: 'Export Appendix 7a (Detailed)' })}
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs font-bold gap-2 cursor-pointer" onClick={() => onPrint(item.id, 'summary')}>
          <LayoutDashboard className="h-3.5 w-3.5" /> {t('csa_hub:history.exportSummary', { defaultValue: 'Export Appendix 7a (Summary)' })}
        </DropdownMenuItem>
        {onExcel && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs font-bold gap-2 cursor-pointer"
              disabled={exportingId === item.id}
              onClick={() => onExcel(item.id, 'detailed')}
            >
              {exportingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
              {t('csa_hub:history.excelDetailed', { defaultValue: 'Excel Appendix 7a (Detailed)' })}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs font-bold gap-2 cursor-pointer"
              disabled={exportingId === item.id}
              onClick={() => onExcel(item.id, 'summary')}
            >
              {exportingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
              {t('csa_hub:history.excelSummary', { defaultValue: 'Excel Appendix 7a (Summary)' })}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 flex-wrap">
        <h3 className="text-xl font-black text-slate-900 tracking-tight min-w-0 truncate">{t('csa_hub:history.title', { defaultValue: 'Assessment History' })}</h3>
        <Button 
          onClick={onNewAssessment} 
          className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs gap-2 min-h-[44px] w-full sm:w-auto"
        >
          <Plus className="h-3.5 w-3.5" /> {t('csa_hub:history.newAssessment', { defaultValue: 'New Assessment' })}
        </Button>
      </div>
      {/* DESKTOP VIEW: Table */}
      <div className="hidden md:block">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="text-xs font-black uppercase">Reference & Period</TableHead>
            <TableHead className="text-xs font-black uppercase text-center">Result</TableHead>
            <TableHead className="text-xs font-black uppercase">Date</TableHead>
            <TableHead className="text-right text-xs font-black uppercase">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={4} className="h-24 text-center"><RefreshCw className="animate-spin inline-block mr-2" /> {t('csa_hub:history.loading', { defaultValue: 'Loading...' })}</TableCell></TableRow>
          ) : items.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No history found.</TableCell></TableRow>
          ) : items.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-bold text-xs">
                <div className="flex flex-col gap-1 items-start">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded shadow-2xs">
                    {formatReference(item)}
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.period}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge className={cn(
                "text-xs font-black uppercase",
                item.result === 'Effective' ? "bg-green-600" : "bg-red-600"
                )}>{item.result}</Badge>              </TableCell>
              <TableCell className="text-xs text-slate-500">
                {formatDateTime(item.assessmentDate)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="outline" size="icon" aria-label={t('csa_hub:history.viewDetail', { defaultValue: 'View detail' })} className="h-7 w-7" onClick={() => onViewDetail(item.id)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  {renderPrintMenu(
                    item,
                    "h-7 w-7 text-indigo-600 border-indigo-200",
                    t('csa_hub:history.printOptions', { defaultValue: 'Print options' })
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    aria-label={t('csa_hub:history.deleteAssessment', { defaultValue: 'Delete assessment' })}
                    className="h-7 w-7 text-slate-300 hover:text-red-600 hover:bg-red-50" 
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>

      {/* MOBILE VIEW: Card stack */}
      <div className="md:hidden space-y-3" data-testid="csa-history-mobile-cards">
        {isLoading ? (
          <div className="h-24 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
            <RefreshCw className="h-4 w-4 animate-spin" />
            {t('csa_hub:history.loading', { defaultValue: 'Loading...' })}
          </div>
        ) : items.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-xs font-medium text-muted-foreground">
            {t('csa_hub:history.empty', { defaultValue: 'No history found.' })}
          </div>
        ) : items.map(item => (
          <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                {formatReference(item)}
              </span>
              <Badge className={cn(
                "text-xs font-black uppercase shrink-0",
                item.result === 'Effective' ? "bg-green-600" : "bg-red-600"
              )}>{item.result}</Badge>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 flex-wrap">
              <span className="font-bold uppercase tracking-wider">{item.period}</span>
              <span>{formatDateTime(item.assessmentDate)}</span>
            </div>
            <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
              <Button
                variant="outline"
                onClick={() => onViewDetail(item.id)}
                className="flex-1 min-h-[44px] text-xs font-bold gap-2"
              >
                <Eye className="h-4 w-4" />
                {t('csa_hub:history.viewDetail', { defaultValue: 'View detail' })}
              </Button>
              {renderPrintMenu(
                item,
                "min-h-[44px] min-w-[44px] text-indigo-600 border-indigo-200 shrink-0",
                t('csa_hub:history.printOptions', { defaultValue: 'Print options' })
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('csa_hub:history.deleteAssessment', { defaultValue: 'Delete assessment' })}
                onClick={() => onDelete(item.id)}
                className="min-h-[44px] min-w-[44px] text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
