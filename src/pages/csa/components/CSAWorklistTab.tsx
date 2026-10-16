import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertTriangle, ClipboardList, Loader2, Play, Search } from 'lucide-react';
import { CSAModal } from '@/components/bpm/CSAModal';
import { authClient } from '@/lib/auth-client';
import { useCsaWorklist, type WorklistTabItem } from '../utils/use-csa-worklist';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';

/**
 * Tab "Belum Dinilai" CSA hub: control tanpa record non-draft, dikelompokkan
 * per sub-proses BPM. Aksi membuka workspace eksekusi CSA yang sudah ada
 * (CSAModal); saat dialog ditutup, worklist di-refresh agar item yang baru
 * di-sign-off hilang dari daftar.
 */
export function CSAWorklistTab() {
  const { t } = useTranslation(['csa_hub', 'common']);
  const queryClient = useQueryClient();
  const { groups, emptyKind, total, isLoading, isError, refetch } = useCsaWorklist();
  const { workingYear } = useFiscalYearStore();
  const [selected, setSelected] = React.useState<WorklistTabItem | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { data: session } = authClient.useSession();
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const readOnly = userRole === 'Line 2';

  const visibleGroups = React.useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return groups;
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          [group.title, item.name, item.code, item.riskDescription].some((field) =>
            (field ?? '').toLowerCase().includes(query),
          ),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, searchTerm]);

  if (isLoading) {
    return (
      <div className="border rounded-lg bg-white shadow-sm p-6 flex flex-col items-center gap-3" data-testid="worklist-loading">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {t('page.worklist.loading')}
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border rounded-lg bg-white shadow-sm p-6 flex flex-col items-start gap-3">
        <p className="text-sm font-medium text-slate-600 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          {t('page.worklist.error')}
        </p>
        <Button variant="outline" size="sm" onClick={refetch} className="h-11 md:h-8 min-h-[44px] text-xs font-bold">
          {t('page.worklist.retry')}
        </Button>
      </div>
    );
  }

  if (emptyKind) {
    return (
      <div className="border rounded-lg bg-white shadow-sm p-6 flex items-center gap-3">
        <ClipboardList className="h-5 w-5 text-indigo-600 shrink-0" />
        <p className="text-sm font-medium text-slate-600">
          {emptyKind === 'no-controls' ? t('page.worklist.emptyNoControls') : t('page.worklist.emptyAllAssessed')}
        </p>
      </div>
    );
  }

  const openWorkspace = (item: WorklistTabItem) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(item);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-none sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            id="csa-worklist-search"
            placeholder={t('page.worklist.searchPlaceholder')}
            className="pl-10 h-11 min-h-[44px] bg-slate-50/50 border-slate-200 rounded-lg text-base sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Badge variant="outline" className="text-xs font-semibold bg-white self-start sm:self-auto">
          {t('page.worklist.count', { count: total })}
        </Badge>
      </div>

      {/* DESKTOP VIEW: grouped table */}
      <div className="hidden md:block border rounded-lg bg-white shadow-sm overflow-x-auto max-w-full touch-pan-x overscroll-x-contain">
        <Table className="min-w-[720px]">
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 py-4 pl-6">{t('page.worklist.table.code')}</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('page.worklist.table.control')}</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('page.worklist.table.risk')}</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500 pr-6">{t('page.worklist.table.action')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleGroups.map((group) => (
              <React.Fragment key={group.key}>
                <TableRow className="bg-indigo-50/50 hover:bg-indigo-50/50" data-testid={`worklist-group-${group.key}`}>
                  <TableCell colSpan={4} className="py-2.5 pl-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                      {group.title ?? t('page.unknownProcess')}
                    </span>
                    <Badge variant="outline" className="ml-2 text-xs font-semibold bg-white">
                      {group.items.length}
                    </Badge>
                  </TableCell>
                </TableRow>
                {group.items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-indigo-50/10 transition-colors">
                    <TableCell className="pl-6 text-xs font-bold text-slate-700">{item.code}</TableCell>
                    <TableCell className="text-sm font-bold text-slate-900">{item.name}</TableCell>
                    <TableCell className="text-xs text-slate-500 font-medium">{item.riskDescription ?? '—'}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        size="sm"
                        onClick={openWorkspace(item)}
                        disabled={readOnly}
                        title={readOnly ? t('page.worklist.ctaReadOnly') : undefined}
                        className="h-11 md:h-8 min-h-[44px] text-xs gap-1.5 font-bold shadow-sm"
                      >
                        <Play className="h-3.5 w-3.5" />
                        {t('page.worklist.cta')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* MOBILE VIEW: card stack */}
      <div className="block md:hidden space-y-4">
        {visibleGroups.map((group) =>
          group.items.map((item) => (
            <div key={`mobile-${item.id}`} data-testid="worklist-card" className="p-4 bg-card border rounded-lg shadow-sm space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                {group.title ?? t('page.unknownProcess')}
              </span>
              <p className="text-sm font-bold text-slate-900">{item.name}</p>
              <p className="text-xs text-slate-500 font-medium">{item.code}</p>
              {item.riskDescription && (
                <p className="text-xs text-slate-500 font-medium">{item.riskDescription}</p>
              )}
              <Button
                size="sm"
                onClick={openWorkspace(item)}
                disabled={readOnly}
                title={readOnly ? t('page.worklist.ctaReadOnly') : undefined}
                className="h-11 min-h-[44px] w-full text-xs gap-1.5 font-bold shadow-sm"
              >
                <Play className="h-3.5 w-3.5" />
                {t('page.worklist.cta')}
              </Button>
            </div>
          )),
        )}
      </div>

      {selected && (
        <CSAModal
          isOpen
          onOpenChange={(open) => {
            if (!open) {
              setSelected(null);
              void queryClient.invalidateQueries({ queryKey: ['csa-worklist', workingYear] });
            }
          }}
          noGL={selected.noGL ?? ''}
          subProcessName={selected.bpmProcessName ?? t('page.unknownProcess')}
          bpmProcessId={selected.bpmProcessId ?? undefined}
        />
      )}
    </div>
  );
}
