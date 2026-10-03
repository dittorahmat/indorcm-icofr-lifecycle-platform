import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { 
  Edit3, Shield, PlusCircle, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { RCMPageHeader } from '@/components/rcm/RCMPageHeader';
import { RCMTable, RCMColumnGroup } from '@/components/rcm/RCMTable';
import { RCMGroupRow } from '@/components/rcm/RCMGroupRow';
import { VerificationEditDialog } from '@/components/rcm/VerificationEditDialog';
import { AddAssessmentDialog } from '@/components/rcm/AddAssessmentDialog';
import { authClient } from '@/lib/auth-client';

interface VerificationMatrixItem {
  id: string;
  controlId: string;
  mappingId: string;
  companyName: string;
  locationCode: string;
  // Lini 1 Data
  controlCode: string;
  controlName: string;
  controlDescription: string;
  supportingDocs: string;
  isKeyControl: boolean;
  ipoC: string;
  ipoA: string;
  ipoV: string;
  ipoRa: string;
  assertionE: string;
  assertionC: string;
  assertionA: string;
  assertionCo: string;
  assertionVa: string;
  assertionRo: string;
  assertionPd: string;
  controlType: string;
  controlNature: string;
  automatedControlType: string;
  frequency: string;
  supportingApp: string;
  applicationId: string;
  executingFunction: string;
  executorRole: string;
  affectedFsliItem: string;
  effectivePeriod: string;
  // Lini 2 Data
  todId?: string;
  pilarObjective?: string;
  pilarTiming?: string;
  pilarAuthority?: string;
  pilarReliability?: string;
  pilarCoverage?: string;
  pilarEvidence?: string;
  kkReference?: string;
  conclusion?: string;
  comment?: string;
  // Metadata for grouping
  processName?: string;
  subProcessName?: string;
}

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
  const { data: session } = authClient.useSession();
  const userRole = (session?.user as any)?.role;
  const canEdit = userRole === 'Admin' || userRole === 'Line 2';

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

  const columnGroups: RCMColumnGroup[] = React.useMemo(() => [
    {
      title: t('rcm:verification.columns.actions'),
      className: 'bg-slate-200/50 print:hidden',
      columns: [
        {
          id: 'action',
          header: t('common:actions.edit'),
          width: '60px',
          sticky: 'left',
          className: 'print:hidden',
          headerClassName: 'print:hidden',
          render: (row) => canEdit && (
            <Button 
              variant="ghost" 
              size="xs" 
              className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
              onClick={() => setEditingItem(row)}
            >
              <Edit3 className="h-3.5 w-3.5" />
            </Button>
          )
        },
        { id: 'no', header: t('rcm:matrix.no'), width: '50px', sticky: 'left', stickyOffset: '60px', className: 'text-center font-mono text-xs text-slate-400', render: (_, idx) => idx + 1 },
        { id: 'control_ref', header: t('rcm:verification.columns.control_ref'), accessorKey: 'controlCode', width: '130px', sticky: 'left', stickyOffset: '110px', className: 'font-mono text-xs font-bold text-slate-600 bg-white' },
      ]
    },
    {
      title: t('rcm:verification.groups.info'),
      className: 'bg-indigo-50/50',
      columns: [
        { id: 'control_name', header: t('rcm:verification.columns.control_name'), accessorKey: 'controlName', width: '280px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'control_desc', header: t('rcm:matrix.control_description'), accessorKey: 'controlDescription', width: '350px', className: 'text-xs text-slate-600 font-normal italic' },
        { id: 'docs', header: t('rcm:matrix.supporting_docs'), accessorKey: 'supportingDocs', width: '200px', className: 'text-xs text-slate-800 font-normal' },
        { 
          id: 'is_key', 
          header: t('rcm:verification.columns.is_key'), 
          width: '90px', 
          className: 'text-center text-xs font-mono',
          render: (row) => (
            <span className={cn(row.isKeyControl ? "font-bold text-indigo-700" : "text-slate-400 font-normal")}>
              {row.isKeyControl ? 'Y' : 'N'}
            </span>
          )
        },
      ]
    },
    {
      title: t('rcm:matrix.ipo'),
      className: 'bg-blue-600 text-white',
      columns: [
        { id: 'ipoC', header: 'C', width: '40px', className: 'text-center text-xs font-mono text-slate-700', render: (row) => row.ipoC === 'Y' ? 'Y' : 'N' },
        { id: 'ipoA', header: 'A', width: '40px', className: 'text-center text-xs font-mono text-slate-700', render: (row) => row.ipoA === 'Y' ? 'Y' : 'N' },
        { id: 'ipoV', header: 'V', width: '40px', className: 'text-center text-xs font-mono text-slate-700', render: (row) => row.ipoV === 'Y' ? 'Y' : 'N' },
        { id: 'ipoRa', header: 'RA', width: '40px', className: 'text-center text-xs font-mono text-slate-700', render: (row) => row.ipoRa === 'Y' ? 'Y' : 'N' },
      ]
    },
    {
      title: t('rcm:matrix.assertions'),
      className: 'bg-indigo-600 text-white',
      columns: [
        { id: 'ae', header: 'E/O', width: '40px', className: 'text-center text-xs font-mono text-slate-700', render: (row) => row.assertionE === 'Y' ? 'Y' : 'N' },
        { id: 'ac', header: 'C', width: '40px', className: 'text-center text-xs font-mono text-slate-700', render: (row) => row.assertionC === 'Y' ? 'Y' : 'N' },
        { id: 'aa', header: 'A', width: '40px', className: 'text-center text-xs font-mono text-slate-700', render: (row) => row.assertionA === 'Y' ? 'Y' : 'N' },
        { id: 'aco', header: 'CO', width: '40px', className: 'text-center text-xs font-mono text-slate-700', render: (row) => row.assertionCo === 'Y' ? 'Y' : 'N' },
        { id: 'aro', header: 'R&O', width: '40px', className: 'text-center text-xs font-mono text-slate-700', render: (row) => row.assertionRo === 'Y' ? 'Y' : 'N' },
        { id: 'ava', header: 'V/A', width: '40px', className: 'text-center text-xs font-mono text-slate-700', render: (row) => row.assertionVa === 'Y' ? 'Y' : 'N' },
        { id: 'apd', header: 'PD', width: '40px', className: 'text-center text-xs font-mono text-slate-700', render: (row) => row.assertionPd === 'Y' ? 'Y' : 'N' },
      ]
    },
    {
      title: t('rcm:matrix.groups.metadata'),
      columns: [
        { id: 'type', header: t('rcm:matrix.type'), accessorKey: 'controlType', width: '120px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'nature', header: t('rcm:matrix.nature'), accessorKey: 'controlNature', width: '150px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'auto_type', header: t('rcm:matrix.automated_type'), accessorKey: 'automatedControlType', width: '150px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'frequency', header: t('rcm:matrix.frequency'), accessorKey: 'frequency', width: '100px', className: 'text-xs text-slate-800 font-normal text-center' },
        { id: 'app', header: t('rcm:matrix.supporting_app'), accessorKey: 'supportingApp', width: '150px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'function', header: t('rcm:matrix.executing_function'), accessorKey: 'executingFunction', width: '150px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'role', header: t('rcm:matrix.executor_role'), accessorKey: 'executorRole', width: '150px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'fsli', header: t('rcm:matrix.affected_fsli_item'), accessorKey: 'affectedFsliItem', width: '150px', className: 'text-xs font-mono text-slate-600' },
        { id: 'period', header: t('rcm:matrix.effective_period'), accessorKey: 'effectivePeriod', width: '120px', className: 'text-xs font-semibold text-indigo-700' },
      ]
    },
    {
      title: t('rcm:verification.groups.tod'),
      className: 'bg-amber-50',
      columns: [
        { id: 'p_obj', header: t('rcm:verification.columns.p_obj'), accessorKey: 'pilarObjective', width: '150px', className: 'text-xs' },
        { id: 'p_time', header: t('rcm:verification.columns.p_time'), accessorKey: 'pilarTiming', width: '150px', className: 'text-xs' },
        { id: 'p_auth', header: t('rcm:verification.columns.p_auth'), accessorKey: 'pilarAuthority', width: '150px', className: 'text-xs' },
        { id: 'p_rel', header: t('rcm:verification.columns.p_rel'), accessorKey: 'pilarReliability', width: '150px', className: 'text-xs' },
        { id: 'p_cov', header: t('rcm:verification.columns.p_cov'), accessorKey: 'pilarCoverage', width: '150px', className: 'text-xs' },
        { id: 'p_evid', header: t('rcm:verification.columns.p_evid'), accessorKey: 'pilarEvidence', width: '150px', className: 'text-xs' },
        { id: 'kk_ref', header: t('rcm:verification.columns.kk_ref'), accessorKey: 'kkReference', width: '120px', className: 'font-mono text-xs' },
        { 
          id: 'conclusion', 
          header: t('rcm:verification.columns.conclusion'), 
          width: '120px', 
          className: 'text-center',
          render: (row) => row.conclusion && (
            <Badge variant="outline" className={cn("text-[10px] uppercase font-bold", 
              row.conclusion === 'Effective' ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
            )}>
              {row.conclusion === 'Effective' ? t('common:status.effective') : t('common:status.ineffective')}
            </Badge>
          )
        },
      ]
    }
  ], [t, canEdit]);

  const newAssessmentButton = canEdit ? (
    <Button
      id="btn-new-verification-assessment"
      size="xs"
      onClick={() => setIsAddDialogOpen(true)}
      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-7 text-xs flex items-center gap-1.5 px-3 shadow-sm"
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 border-b bg-slate-50 shrink-0">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder="Search matrix..." 
                className="pl-8 bg-white border-slate-200 h-8 text-xs font-medium" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            {newAssessmentButton}
          </div>
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider hidden md:inline">
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
