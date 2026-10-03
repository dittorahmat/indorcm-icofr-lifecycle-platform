import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ChangeLog, User } from '@shared/types';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, History, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface Lampiran6LogViewProps {
  entityId?: string;
  year?: string;
  subProcessName?: string;
  bpmProcessId?: string;
}

export function Lampiran6LogView({ entityId, year, subProcessName, bpmProcessId }: Lampiran6LogViewProps) {
  const { t } = useTranslation('bpm');
  const [showFullTable, setShowFullTable] = useState(false);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['change-logs', entityId, year, subProcessName, bpmProcessId],
    queryFn: async () => {
      const all = await api<{ items: ChangeLog[] }>('/api/change-logs');
      return all.items.filter(l => {
        const dAfter = l.dataAfter as any;
        const dBefore = l.dataBefore as any;

        // SubProcess matching
        const targetSub = subProcessName ? subProcessName.toLowerCase().trim() : '';
        const logSub = (dAfter?.subProcess || dBefore?.subProcess || '').toLowerCase().trim();

        // Process ID matching
        const logProcessId = dAfter?.bpmProcessId || dBefore?.bpmProcessId;

        // Check if log belongs to this sub-process context strictly
        let matchesContext = false;
        if (bpmProcessId) {
          matchesContext = logProcessId === bpmProcessId || l.entityId === bpmProcessId;
        }
        
        if (!matchesContext && targetSub) {
          if (logSub === targetSub) {
            // When matching by subProcess name, if entityId (noGL) is also provided, enforce that entityId matches
            matchesContext = !entityId || l.entityId === entityId || dAfter?.noGL === entityId || dBefore?.noGL === entityId;
          }
        } else if (!matchesContext && !bpmProcessId && !targetSub && entityId) {
          // Only fall back to entityId if neither bpmProcessId nor targetSub was specified
          matchesContext = l.entityId === entityId;
        }

        // If filter parameters were passed, require a strict match
        if ((targetSub || bpmProcessId || entityId) && !matchesContext) {
          return false;
        }

        // Optional Year filter
        if (year && l.timestamp) {
          const logYear = new Date(l.timestamp).getFullYear().toString();
          if (logYear !== year) return false;
        }

        return true;
      }).sort((a, b) => b.timestamp - a.timestamp);
    }
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => api<{ items: User[] }>('/api/users')
  });

  const getUserName = (id?: string) => users?.items.find(u => u.id === id)?.name || id || "-";

  const getRowMetadata = (log: ChangeLog) => {
    const dataBefore = log.dataBefore as any;
    const dataAfter = log.dataAfter as any;

    const process = dataAfter?.businessProcess || dataAfter?.process || dataBefore?.businessProcess || dataBefore?.process || "-";
    const subProcess = dataAfter?.subProcess || dataBefore?.subProcess || subProcessName || "-";
    const descBefore = dataBefore?.controlDescription || dataBefore?.riskDescription || log.descriptionBefore || "-";
    const descAfter = dataAfter?.controlDescription || dataAfter?.riskDescription || log.descriptionAfter || "-";
    const refBefore = dataBefore?.controlId || dataBefore?.code || dataBefore?.id || "-";
    const refAfter = dataAfter?.controlId || dataAfter?.code || dataAfter?.id || "-";
    const owner = dataAfter?.executingFunction || dataAfter?.executorRole || dataBefore?.executingFunction || (log.userId ? getUserName(log.userId) : "-");

    return { process, subProcess, descBefore, descAfter, refBefore, refAfter, owner };
  };

  const renderTable = () => (
    <Table className="min-w-[1200px]">
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead className="w-[50px] text-xs font-bold uppercase py-3 text-center">{t('logView.cols.no')}</TableHead>
          <TableHead className="text-xs font-bold uppercase py-3">{t('logView.cols.company')}</TableHead>
          <TableHead className="text-xs font-bold uppercase py-3">{t('logView.cols.process')}</TableHead>
          <TableHead className="text-xs font-bold uppercase py-3">{t('logView.cols.subProcess')}</TableHead>
          <TableHead className="text-xs font-bold uppercase py-3">{t('logView.cols.reportDate')}</TableHead>
          <TableHead className="text-xs font-bold uppercase py-3">{t('logView.cols.owner')}</TableHead>
          <TableHead className="text-xs font-bold uppercase py-3">{t('logView.cols.descBefore')}</TableHead>
          <TableHead className="text-xs font-bold uppercase py-3">{t('logView.cols.descAfter')}</TableHead>
          <TableHead className="text-xs font-bold uppercase py-3 text-center">{t('logView.cols.refBefore')}</TableHead>
          <TableHead className="text-xs font-bold uppercase py-3 text-center">{t('logView.cols.refAfter')}</TableHead>
          <TableHead className="text-xs font-bold uppercase py-3">{t('logView.cols.effectiveDate')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(logs || []).map((log, index) => {
          const meta = getRowMetadata(log);
          return (
            <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
              <TableCell className="text-center font-medium text-xs text-muted-foreground py-3">{index + 1}</TableCell>
              <TableCell className="text-xs font-semibold text-foreground py-3">PT Bukit Asam Tbk</TableCell>
              <TableCell className="text-xs text-foreground py-3">{meta.process}</TableCell>
              <TableCell className="text-xs text-foreground py-3">{meta.subProcess}</TableCell>
              <TableCell className="py-3">
                <span className="text-xs text-muted-foreground font-mono">
                  {log.timestamp ? format(log.timestamp, 'dd MMM yyyy HH:mm') : "-"}
                </span>
              </TableCell>
              <TableCell className="text-xs text-foreground py-3 font-medium">{meta.owner}</TableCell>
              <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground py-3" title={meta.descBefore}>{meta.descBefore}</TableCell>
              <TableCell className="max-w-[200px] truncate text-xs text-foreground py-3 font-semibold" title={meta.descAfter}>{meta.descAfter}</TableCell>
              <TableCell className="text-center text-xs font-mono text-muted-foreground py-3">{meta.refBefore}</TableCell>
              <TableCell className="text-center text-xs font-mono text-foreground py-3 font-semibold">{meta.refAfter}</TableCell>
              <TableCell className="py-3">
                <span className="text-xs font-semibold text-primary">
                  {log.effectiveDate ? format(log.effectiveDate, 'dd MMM yyyy') : "-"}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-semibold">{t('logView.loading')}</p>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3 text-muted-foreground border-2 border-dashed rounded-lg bg-card">
        <History className="h-10 w-10 opacity-30 text-muted-foreground" />
        <p className="text-xs font-medium">{t('logView.empty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            {t('logView.title')}
          </h4>
          <p className="text-xs text-muted-foreground font-medium">{t('logView.subtitle')}</p>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-2 py-0.5 text-xs font-semibold">
          {t('logView.entriesCount', { count: logs.length })}
        </Badge>
      </div>

      {/* DESKTOP VIEW: Full table */}
      <div className="hidden md:block rounded-lg border border-border bg-card shadow-sm overflow-hidden max-w-full">
        <div className="overflow-x-auto w-full max-w-full touch-pan-x overscroll-x-contain table-scroll-hint">
          {renderTable()}
        </div>
      </div>

      {/* MOBILE VIEW: Summary cards */}
      <div className="md:hidden space-y-3" data-testid="lampiran6-mobile-cards">
        {logs.map((log, index) => {
          const meta = getRowMetadata(log);
          return (
            <div key={log.id} className="rounded-lg border border-border bg-card p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {log.timestamp ? format(log.timestamp, 'dd MMM yyyy HH:mm') : "-"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="outline" className="text-xs font-mono">{meta.refBefore}</Badge>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <Badge className="text-xs font-mono">{meta.refAfter}</Badge>
              </div>
              <p className="text-xs font-semibold text-foreground line-clamp-2">{meta.descAfter}</p>
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground flex-wrap">
                <span className="font-medium truncate">{meta.owner}</span>
                <span className="font-semibold text-primary shrink-0">
                  {log.effectiveDate ? format(log.effectiveDate, 'dd MMM yyyy') : "-"}
                </span>
              </div>
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowFullTable(v => !v)}
          aria-expanded={showFullTable}
          className="w-full min-h-[44px] text-xs font-bold gap-2"
        >
          {showFullTable ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {showFullTable
            ? t('bpm:mobile.hideFullTable', { defaultValue: 'Sembunyikan Tabel Penuh' })
            : t('bpm:mobile.fullTable', { defaultValue: 'Lihat Tabel Penuh' })}
        </Button>
      </div>

      {/* MOBILE VIEW: Full table inside a locked scroll container */}
      {showFullTable && (
        <div className="md:hidden rounded-lg border border-border bg-card shadow-sm max-w-full overflow-x-auto touch-pan-x overscroll-x-contain table-scroll-hint">
          {renderTable()}
        </div>
      )}
    </div>
  );
}
