import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { 
  Search, RefreshCw, Edit3, AlertTriangle, Check, Shield, ClipboardCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { RCMPageHeader } from '@/components/rcm/RCMPageHeader';
import { RCMTable, RCMColumnGroup } from '@/components/rcm/RCMTable';
import { RCMGroupRow } from '@/components/rcm/RCMGroupRow';
import { VerificationEditDialog } from '@/components/rcm/VerificationEditDialog';
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

export function VerificationDesignPage() {
  const { t } = useTranslation(['rcm', 'common', 'sidebar']);
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [editingItem, setEditingItem] = React.useState<VerificationMatrixItem | null>(null);
  const { data: session } = authClient.useSession();
  const userRole = (session?.user as any)?.role;
  const canEdit = userRole === 'Admin' || userRole === 'Line 2';

  const { data, isLoading } = useQuery({
    queryKey: ['verification-design-matrix'],
    queryFn: () => api<{ items: VerificationMatrixItem[] }>('/api/rcm-matrix/verification-design'),
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

  const items = data?.items || [];
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
      className: 'bg-slate-200/50',
      columns: [
        {
          id: 'action',
          header: t('common:actions.edit'),
          width: '60px',
          sticky: 'left',
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
        { id: 'control_ref', header: t('rcm:verification.columns.control_ref'), accessorKey: 'controlCode', width: '130px', sticky: 'left', stickyOffset: '110px', className: 'font-mono text-xs font-bold text-indigo-700 bg-white' },
      ]
    },
    {
      title: t('rcm:verification.groups.info'),
      className: 'bg-indigo-50/50',
      columns: [
        { id: 'control_name', header: t('rcm:verification.columns.control_name'), accessorKey: 'controlName', width: '280px', className: 'text-xs text-slate-800 font-bold' },
        { id: 'control_desc', header: t('rcm:matrix.control_description'), accessorKey: 'controlDescription', width: '350px', className: 'text-xs text-slate-600 italic' },
        { id: 'docs', header: t('rcm:matrix.supporting_docs'), accessorKey: 'supportingDocs', width: '200px', className: 'text-xs text-slate-500' },
        { 
          id: 'is_key', 
          header: t('rcm:verification.columns.is_key'), 
          width: '90px', 
          className: 'text-center',
          render: (row) => row.isKeyControl ? <Shield className="h-4 w-4 mx-auto text-indigo-600 fill-indigo-50" /> : 'T'
        },
      ]
    },
    {
      title: t('rcm:matrix.ipo'),
      className: 'bg-blue-600 text-white',
      columns: [
        { id: 'ipoC', header: 'C', width: '40px', className: 'text-center', render: (row) => row.ipoC === 'Y' ? '✓' : '—' },
        { id: 'ipoA', header: 'A', width: '40px', className: 'text-center', render: (row) => row.ipoA === 'Y' ? '✓' : '—' },
        { id: 'ipoV', header: 'V', width: '40px', className: 'text-center', render: (row) => row.ipoV === 'Y' ? '✓' : '—' },
        { id: 'ipoRa', header: 'RA', width: '40px', className: 'text-center', render: (row) => row.ipoRa === 'Y' ? '✓' : '—' },
      ]
    },
    {
      title: t('rcm:matrix.assertions'),
      className: 'bg-indigo-600 text-white',
      columns: [
        { id: 'ae', header: 'E/O', width: '40px', className: 'text-center', render: (row) => row.assertionE === 'Y' ? '✓' : '—' },
        { id: 'ac', header: 'C', width: '40px', className: 'text-center', render: (row) => row.assertionC === 'Y' ? '✓' : '—' },
        { id: 'aa', header: 'A', width: '40px', className: 'text-center', render: (row) => row.assertionA === 'Y' ? '✓' : '—' },
        { id: 'aco', header: 'CO', width: '40px', className: 'text-center', render: (row) => row.assertionCo === 'Y' ? '✓' : '—' },
        { id: 'aro', header: 'R&O', width: '40px', className: 'text-center', render: (row) => row.assertionRo === 'Y' ? '✓' : '—' },
        { id: 'ava', header: 'V/A', width: '40px', className: 'text-center', render: (row) => row.assertionVa === 'Y' ? '✓' : '—' },
        { id: 'apd', header: 'PD', width: '40px', className: 'text-center', render: (row) => row.assertionPd === 'Y' ? '✓' : '—' },
      ]
    },
    {
      title: t('rcm:matrix.groups.metadata'),
      columns: [
        { id: 'type', header: t('rcm:matrix.type'), accessorKey: 'controlType', width: '120px' },
        { id: 'nature', header: t('rcm:matrix.nature'), accessorKey: 'controlNature', width: '150px' },
        { id: 'auto_type', header: t('rcm:matrix.automated_type'), accessorKey: 'automatedControlType', width: '150px' },
        { id: 'frequency', header: t('rcm:matrix.frequency'), accessorKey: 'frequency', width: '100px', className: 'text-center' },
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
              {row.conclusion === 'Effective' ? t('rcm:matrix.properties.synced') : t('deficiency:status.resolved')}
            </Badge>
          )
        },
      ]
    }
  ], [t, canEdit]);

  return (
    <AppLayout container={false} className="bg-slate-100/30">
      <div className="flex flex-col min-w-0 flex-1">
        <RCMPageHeader 
          title={t('rcm:verification.title')}
          subtitle={t('rcm:verification.subtitle')}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['verification-design-matrix'] })}
          metadata={[
            { label: t('rcm:verification.columns.entity'), value: items[0]?.companyName || "N/A" },
            { label: t('rcm:verification.columns.location'), value: items[0]?.locationCode || "N/A" }
          ]}
        />

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
      </div>
    </AppLayout>
  );
}
