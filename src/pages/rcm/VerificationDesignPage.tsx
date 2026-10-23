import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { 
  PlusCircle, Search, Download, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { RCMPageHeader } from '@/components/rcm/RCMPageHeader';
import { RCMTable } from '@/components/rcm/RCMTable';
import { VerificationEditDialog } from '@/components/rcm/VerificationEditDialog';
import { AddAssessmentDialog } from '@/components/rcm/AddAssessmentDialog';
import { useCurrentRole } from '@/hooks/use-current-role';
import { can } from '@shared/entity-authority';
import { exportRegulatoryTableToExcel } from '@/lib/rcm-excel-export';
import {
  ASSERTION_CODE,
  ASSERTION_FIELDS,
  IPO_CODE,
  IPO_FIELDS,
} from '@shared/assertion-fields';
import {
  buildVerificationDesignColumns,
  type VerificationMatrixItem,
} from './verification-design-columns';

export interface VerificationDesignPageProps {
  embedded?: boolean;
  filterBpmId?: string;
  workingYear?: string;
  noGLFilter?: string;
}

export function VerificationDesignPage({ embedded, filterBpmId, workingYear, noGLFilter }: VerificationDesignPageProps) {
  const { t } = useTranslation(['rcm', 'common', 'sidebar']);
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [editingItem, setEditingItem] = React.useState<VerificationMatrixItem | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const userRole = useCurrentRole();
  const canEdit = can(userRole, 'rcm:edit-verification-design');

  const { data, isLoading } = useQuery({
    queryKey: ['verification-design-matrix', filterBpmId, workingYear, noGLFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterBpmId) params.append('bpmProcessId', filterBpmId);
      if (workingYear) params.append('year', workingYear);
      if (noGLFilter) params.append('noGL', noGLFilter);
      const queryStr = params.toString();
      const url = queryStr ? `/api/rcm-matrix/verification-design?${queryStr}` : '/api/rcm-matrix/verification-design';
      return api<{ items: VerificationMatrixItem[] }>(url);
    },
  });

  const saveMutation = useMutation({
    mutationFn: (values: any) => {
      return api(`/api/rcm-matrix/verification-design/${values.mappingId}`, {
        method: 'PATCH',
        body: JSON.stringify(values),
      });
    },
    onSuccess: () => {
      toast.success(t('rcm:matrix.save_success'));
      queryClient.invalidateQueries({ queryKey: ['verification-design-matrix'] });
      setEditingItem(null);
    }
  });

  const items = React.useMemo(() => data?.items || [], [data?.items]);
  const filteredItems = React.useMemo(() => {
    const search = searchTerm.toLowerCase();
    return items.filter(item => 
      item.controlCode?.toLowerCase().includes(search) ||
      item.controlName?.toLowerCase().includes(search) ||
      item.controlDescription?.toLowerCase().includes(search)
    );
  }, [items, searchTerm]);

  const columnGroups = React.useMemo(
    () => buildVerificationDesignColumns({ t, canEdit, onEdit: (item) => setEditingItem(item) }),
    [t, canEdit],
  );

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const yn = (v?: string | null) => (v === 'Y' ? 'Y' : 'N');
      const rows = filteredItems.map((item, index) => ({
        no: index + 1,
        controlCode: item.controlCode,
        controlName: item.controlName,
        controlDescription: item.controlDescription,
        supportingDocs: item.supportingDocs,
        isKey: item.isKeyControl ? 'Y' : 'N',
        ipoC: yn(item.ipoC),
        ipoA: yn(item.ipoA),
        ipoV: yn(item.ipoV),
        ipoRa: yn(item.ipoRa),
        assertionE: yn(item.assertionE),
        assertionC: yn(item.assertionC),
        assertionA: yn(item.assertionA),
        assertionCo: yn(item.assertionCo),
        assertionRo: yn(item.assertionRo),
        assertionVa: yn(item.assertionVa),
        assertionPd: yn(item.assertionPd),
        controlType: item.controlType,
        controlNature: item.controlNature,
        automatedControlType: item.automatedControlType,
        frequency: item.frequency,
        supportingApp: item.supportingApp,
        executingFunction: item.executingFunction,
        executorRole: item.executorRole,
        affectedFsliItem: item.affectedFsliItem,
        effectivePeriod: item.effectivePeriod,
        pilarObjective: item.pilarObjective,
        pilarTiming: item.pilarTiming,
        pilarAuthority: item.pilarAuthority,
        pilarReliability: item.pilarReliability,
        pilarCoverage: item.pilarCoverage,
        pilarEvidence: item.pilarEvidence,
        kkReference: item.kkReference,
        conclusion: item.conclusion,
      }));

      const col = (key: string, header: string, numeric = false) => ({ key, header, numeric });
      const yearLabel = workingYear || String(new Date().getFullYear());
      await exportRegulatoryTableToExcel(rows, {
        title: t('rcm:verification.excelTitle', { defaultValue: 'LAMPIRAN 8' }),
        subtitle: t('rcm:verification.subtitle', { defaultValue: '' }),
        identityLines: [items[0]?.companyName || 'N/A', items[0]?.locationCode || 'N/A', yearLabel],
        groups: [
          { label: t('rcm:verification.groups.info', { defaultValue: 'Informasi Pengendalian' }), span: 6 },
          { label: t('rcm:matrix.ipo', { defaultValue: 'IPO' }), span: 4 },
          { label: t('rcm:matrix.assertions', { defaultValue: 'Asersi' }), span: 7 },
          { label: t('rcm:matrix.groups.metadata', { defaultValue: 'Metadata' }), span: 9 },
          { label: t('rcm:verification.groups.tod', { defaultValue: 'Verifikasi 6 Pilar' }), span: 8 },
        ],
        columns: [
          col('no', t('rcm:matrix.no', { defaultValue: 'No' }), true),
          col('controlCode', t('rcm:verification.columns.control_ref', { defaultValue: 'Referensi' })),
          col('controlName', t('rcm:verification.columns.control_name', { defaultValue: 'Nama Pengendalian' })),
          col('controlDescription', t('rcm:matrix.control_description', { defaultValue: 'Deskripsi' })),
          col('supportingDocs', t('rcm:matrix.supporting_docs', { defaultValue: 'Dokumen' })),
          col('isKey', t('rcm:verification.columns.is_key', { defaultValue: 'Utama' })),
          ...IPO_FIELDS.map((field) => col(field, IPO_CODE[field])),
          ...ASSERTION_FIELDS.map((field) => col(field, ASSERTION_CODE[field])),
          col('controlType', t('rcm:matrix.type', { defaultValue: 'Tipe' })),
          col('controlNature', t('rcm:matrix.nature', { defaultValue: 'Sifat' })),
          col('automatedControlType', t('rcm:matrix.automated_type', { defaultValue: 'Jenis Otomatis' })),
          col('frequency', t('rcm:matrix.frequency', { defaultValue: 'Frekuensi' })),
          col('supportingApp', t('rcm:matrix.supporting_app', { defaultValue: 'Aplikasi' })),
          col('executingFunction', t('rcm:matrix.executing_function', { defaultValue: 'Fungsi Pelaksana' })),
          col('executorRole', t('rcm:matrix.executor_role', { defaultValue: 'Pelaku' })),
          col('affectedFsliItem', t('rcm:matrix.affected_fsli_item', { defaultValue: 'FSLI Terdampak' })),
          col('effectivePeriod', t('rcm:matrix.effective_period', { defaultValue: 'Periode Efektif' })),
          col('pilarObjective', t('rcm:verification.columns.p_obj', { defaultValue: 'Pilar Tujuan' })),
          col('pilarTiming', t('rcm:verification.columns.p_time', { defaultValue: 'Pilar Waktu' })),
          col('pilarAuthority', t('rcm:verification.columns.p_auth', { defaultValue: 'Pilar Otoritas' })),
          col('pilarReliability', t('rcm:verification.columns.p_rel', { defaultValue: 'Pilar Reliabilitas' })),
          col('pilarCoverage', t('rcm:verification.columns.p_cov', { defaultValue: 'Pilar Cakupan' })),
          col('pilarEvidence', t('rcm:verification.columns.p_evid', { defaultValue: 'Pilar Bukti' })),
          col('kkReference', t('rcm:verification.columns.kk_ref', { defaultValue: 'Ref. KK' })),
          col('conclusion', t('rcm:verification.columns.conclusion', { defaultValue: 'Kesimpulan' })),
        ],
        filename: `Lampiran_8_Verifikasi_Rancangan_${yearLabel}.xlsx`,
        sheetName: t('rcm:verification.excelTitle', { defaultValue: 'Lampiran 8' }),
      });
      toast.success(t('common:notifications.exportSuccess', { defaultValue: 'Excel berhasil diunduh' }));
    } catch (err: any) {
      toast.error(err?.message || t('common:notifications.exportFailed', { defaultValue: 'Gagal mengekspor Excel' }));
    } finally {
      setIsExporting(false);
    }
  };

  const newAssessmentButton = canEdit ? (
    <Button
      id="btn-new-verification-assessment"
      size="xs"
      onClick={() => setIsAddDialogOpen(true)}
      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 sm:h-7 min-h-[44px] sm:min-h-0 text-xs flex items-center justify-center gap-1.5 px-3 shadow-sm w-full sm:w-auto shrink-0"
    >
      <PlusCircle className="h-3.5 w-3.5" />
      {t('rcm:verification.add_new_short')}
    </Button>
  ) : null;

  const content = (
    <div className={cn("flex flex-col min-w-0 flex-1 min-h-0", embedded && "h-full")}>
      {!embedded && (
        <RCMPageHeader 
          title={t('rcm:verification.title')}
          subtitle={t('rcm:verification.subtitle')}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['verification-design-matrix'] })}
          onPrint={() => window.print()}
          onExport={() => void handleExportExcel()}
          exportLabel={t('rcm:actions.export_excel', { defaultValue: 'Export Excel' })}
          metadata={[
            { label: t('rcm:verification.columns.entity'), value: items[0]?.companyName || "N/A" },
            { label: t('rcm:verification.columns.location'), value: items[0]?.locationCode || "N/A" }
          ]}
        >
          {newAssessmentButton}
        </RCMPageHeader>
      )}

      <RCMTable 
        groups={columnGroups}
        data={filteredItems}
        isLoading={isLoading}
        minWidth="4200px"
      />

      {editingItem && (
        <VerificationEditDialog 
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          data={editingItem}
          onSave={(values) => saveMutation.mutate(values)}
          isSaving={saveMutation.isPending}
        />
      )}

      <AddAssessmentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        filterBpmId={filterBpmId}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['verification-design-matrix'] })}
      />
    </div>
  );

  if (embedded) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b bg-slate-50 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-0 w-full sm:max-w-md">
            <div className="relative w-full min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t('rcm:actions.search_matrix', { defaultValue: 'Search matrix...' })}
                className="pl-8 bg-white border-slate-200 h-11 sm:h-8 min-h-[44px] sm:min-h-0 text-base sm:text-xs font-medium w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
            {newAssessmentButton}
            <Button
              size="xs"
              variant="outline"
              onClick={() => void handleExportExcel()}
              disabled={isExporting}
              className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 text-xs font-bold gap-1.5 px-3 w-full sm:w-auto justify-center"
            >
              {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              {t('rcm:actions.export_excel', { defaultValue: 'Export Excel' })}
            </Button>
            </div>
          </div>
          <span className="order-first sm:order-none truncate min-w-0 max-w-full text-xs font-black text-slate-400 uppercase tracking-wider">
            {t('rcm:verification.title')}
          </span>
        </div>
        <div className="flex-1 overflow-auto">
          {content}
        </div>
      </div>
    );
  }

  return (
    <AppLayout container={false} noScroll className="bg-slate-100/30">
      {content}
    </AppLayout>
  );
}
