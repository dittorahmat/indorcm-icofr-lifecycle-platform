import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { CSARecord, BPMProcess } from '@shared/types';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { History, Search, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { CSARecordCard } from '@/components/csa/CSARecordCard';
import { MobileDesktopBanner } from '@/components/layout/MobileDesktopBanner';
import { CollapsibleFilterCard } from '@/components/layout/CollapsibleFilterCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { CSARecordRow } from './components/CSARecordRow';
import { CSAWorklistTab } from './components/CSAWorklistTab';

type CSAResultFilter = 'all' | 'Effective' | 'Ineffective';


export function CSAPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [resultFilter, setResultFilter] = React.useState<CSAResultFilter>('all');
  const { t } = useTranslation(['csa_hub', 'common']);
  const { workingYear } = useFiscalYearStore();

  const { data: records, isLoading } = useQuery({
    queryKey: ['csa-records-all', workingYear],
    queryFn: () => api<{ items: CSARecord[] }>(`/api/csa?year=${workingYear}`),
  });

  const { data: processes } = useQuery({
    queryKey: ['bpm-processes-all', workingYear],
    queryFn: () => api<{ items: BPMProcess[] }>(`/api/bpm-processes?year=${workingYear}`),
  });

  const assessedBase = React.useMemo(() => {
    if (!records?.items) return [];
    const term = searchTerm.toLowerCase();
    return records.items.filter(r => {
      // Assessed scope covers concluded outcomes only (Effective + Ineffective).
      // Records with No Transaction stay hidden. TOE / regulatory review
      // eligibility remains Effective-only downstream.
      if (r.result !== 'Effective' && r.result !== 'Ineffective') return false;

      const process = processes?.items.find(p => p.id === r.bpmProcessId);
      return (process?.name ?? '').toLowerCase().includes(term) ||
             r.period.toLowerCase().includes(term);
    });
  }, [records, processes, searchTerm]);

  const resultCounts = React.useMemo(() => ({
    all: assessedBase.length,
    Effective: assessedBase.filter(r => r.result === 'Effective').length,
    Ineffective: assessedBase.filter(r => r.result === 'Ineffective').length,
  }), [assessedBase]);

  const resultFilterOptions: { value: CSAResultFilter; label: string; count: number }[] = [
    { value: 'all', label: t('page.resultFilter.all', { defaultValue: 'Semua' }), count: resultCounts.all },
    { value: 'Effective', label: t('page.resultFilter.effective', { defaultValue: 'Efektif' }), count: resultCounts.Effective },
    { value: 'Ineffective', label: t('page.resultFilter.ineffective', { defaultValue: 'Tidak Efektif' }), count: resultCounts.Ineffective },
  ];

  const filteredRecords = React.useMemo(() => {
    if (resultFilter === 'all') return assessedBase;
    return assessedBase.filter(r => r.result === resultFilter);
  }, [assessedBase, resultFilter]);

  return (
    <AppLayout container>
      <div className="space-y-6 pb-6 md:pb-8 pt-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 flex-wrap min-w-0 max-w-full">
          <div className="min-w-0 max-w-full">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 bg-indigo-600 rounded-lg shadow-lg sm:shadow-xl shadow-indigo-200 ring-2 sm:ring-4 ring-indigo-50 shrink-0">
                 <History className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <span>{t('page.title')}</span>
                <div className="h-1.5 w-1/2 bg-indigo-600 rounded-full mt-1" />
              </div>
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-2 sm:mt-3 font-medium max-w-xl leading-relaxed">
              {t('page.description')}
            </p>
          </div>
        </div>

        <CollapsibleFilterCard
          title={t('page.filtersTitle')}
          layout="section"
          testId="csa-filters"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 bg-white p-3.5 sm:p-6 rounded-lg border shadow-sm ring-1 ring-slate-200/50">
            <div className="relative flex-1 max-w-none sm:max-w-md">
              <Label htmlFor="csa-search" className="sr-only">Search CSA Records</Label>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="csa-search"
                placeholder={t('page.searchPlaceholder')}
                className="pl-10 h-11 min-h-[44px] bg-slate-50/50 border-slate-200 rounded-lg focus:ring-indigo-500 transition-all text-base sm:text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2.5 px-3.5 sm:px-5 py-2.5 sm:py-3 bg-indigo-50/70 rounded-lg border border-indigo-100 shadow-xs shrink-0">
               <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 shrink-0" />
               <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold uppercase text-indigo-700 tracking-wider leading-none truncate">{t('page.modeBadge')}</span>
                  <span className="text-xs font-medium text-indigo-500 uppercase tracking-tight mt-0.5 truncate">{t('page.modeSubtitle')}</span>
               </div>
            </div>
          </div>
        </CollapsibleFilterCard>

        <Tabs defaultValue="assessed" className="w-full min-w-0">
          <TabsList className="grid w-full grid-cols-2 h-11 min-h-[44px] max-w-md">
            <TabsTrigger value="assessed" className="text-xs font-bold uppercase tracking-wider">
              {t('page.tabs.assessed')}
            </TabsTrigger>
            <TabsTrigger value="unassessed" className="text-xs font-bold uppercase tracking-wider">
              {t('page.tabs.unassessed')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="assessed" className="space-y-4 mt-4 min-w-0">
        <div
          role="group"
          aria-label={t('page.resultFilter.label', { defaultValue: 'Filter hasil penilaian' })}
          data-testid="csa-result-filter"
          className="flex flex-wrap gap-2"
        >
          {resultFilterOptions.map((opt) => {
            const isActive = resultFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={isActive}
                data-testid={`csa-result-filter-${opt.value.toLowerCase()}`}
                onClick={() => setResultFilter(opt.value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md border px-3 min-h-[44px] text-xs font-bold uppercase tracking-wider transition-colors",
                  isActive
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200"
                )}
              >
                <span>{opt.label}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-bold border-transparent",
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {opt.count}
                </Badge>
              </button>
            );
          })}
        </div>
        {/* DESKTOP VIEW: Table */}
        <div className="hidden md:block border rounded-lg bg-white shadow-sm overflow-x-auto max-w-full touch-pan-x overscroll-x-contain">
          <Table className="min-w-[720px]">
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 py-4 pl-6">{t('page.table.subProcess')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">{t('page.table.period')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">{t('page.table.status')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('page.table.signOff')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">{t('page.table.samples')}</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500 pr-6">{t('page.table.reports')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="border-none"><TableCell colSpan={6} className="h-80 text-center border-none">
                   <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="h-10 w-10 border-4 border-slate-100 rounded-full" />
                        <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
                      </div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('page.loading')}</span>
                   </div>
                </TableCell></TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow className="border-none"><TableCell colSpan={6} className="h-80 text-center text-slate-500 font-normal border-none">{t('page.empty')}</TableCell></TableRow>
              ) : filteredRecords.map((record) => (
                <CSARecordRow 
                  key={record.id} 
                  record={record} 
                  process={processes?.items.find(p => p.id === record.bpmProcessId)} 
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* MOBILE VIEW: Executive Summary & Card Stack */}
        <div className="block md:hidden space-y-4">
          <MobileDesktopBanner recordCount={filteredRecords.length} />
          {/* Executive Summary Card */}
          {records?.items && records.items.length > 0 && (
            <div className="p-4 bg-card border rounded-lg shadow-sm space-y-3" data-testid="csa-mobile-executive-summary">
              <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between border-b pb-2 flex-wrap gap-2 min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  {t('page.summary.title', { defaultValue: 'Ringkasan Eksekutif Pengujian' })}
                </span>
                <Badge variant="outline" className="text-xs font-semibold">
                  {records.items.length} {t('page.table.subProcess', { defaultValue: 'Proses' })}
                </Badge>
              </div>

              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2 text-center">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-md">
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 block">
                    {t('page.summary.effective', { defaultValue: 'Efektif' })}
                  </span>
                  <span className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                    {records.items.filter(r => r.result === 'Effective').length}
                  </span>
                </div>
                <div className="p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-md">
                  <span className="text-xs font-medium text-red-700 dark:text-red-300 block">
                    {t('page.summary.ineffective', { defaultValue: 'Defisiensi' })}
                  </span>
                  <span className="text-lg font-bold text-red-800 dark:text-red-200">
                    {records.items.filter(r => r.result === 'Ineffective').length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-lg border p-6">
              <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('page.loading')}</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="h-48 flex items-center justify-center bg-card rounded-lg border border-border p-6 text-center text-muted-foreground text-xs font-medium">
              {t('page.empty')}
            </div>
          ) : (
            filteredRecords.map((record) => (
              <CSARecordCard
                key={`mobile-${record.id}`}
                record={record}
                process={processes?.items.find(p => p.id === record.bpmProcessId)}
              />
            ))
          )}
        </div>
          </TabsContent>
          <TabsContent value="unassessed" className="mt-4 min-w-0">
            <CSAWorklistTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
