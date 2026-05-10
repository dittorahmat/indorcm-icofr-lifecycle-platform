import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { RCMControlMapping } from '@shared/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';
import { RCMPageHeader } from '@/components/rcm/RCMPageHeader';
import { InlineEditRow } from '@/components/rcm/InlineEditRow';

interface RCMMatrixItem extends RCMControlMapping {
  mappingId: string;
  processName: string;
  bpmCode?: string;
  fsliName: string;
  noGL: string;
  subProcessName: string;
  riskDescription: string;
  isFraudRelated: boolean;
  riskRating: string;
  controlCode: string;
  baseControlName: string;
  baseControlDescription: string;
  mappedControlName?: string;
  mappedControlDescription?: string;
  companyName: string;
  locationCode: string;
  automatedSubNature?: string | null;
}

interface RCMITGCPageProps {
  embedded?: boolean;
  filterBpmId?: string;
}

export function RCMITGCPage({ embedded = false, filterBpmId }: RCMITGCPageProps) {
  const { t } = useTranslation(['rcm', 'common']);
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [localItems, setLocalItems] = React.useState<RCMMatrixItem[]>([]);
  const [editingMappingId, setEditingMappingId] = React.useState<string | null>(null);

  const { data: matrixData, isLoading } = useQuery({
    queryKey: ['rcm-matrix-itgc', filterBpmId],
    queryFn: async () => {
      const url = filterBpmId ? `/api/rcm-matrix/itgc?bpmProcessId=${filterBpmId}` : '/api/rcm-matrix/itgc';
      const res = await api<{ items: RCMMatrixItem[] }>(url);
      setLocalItems(res.items);
      return res;
    },
  });

  const { data: appsData } = useQuery({
    queryKey: ['applications-list'],
    queryFn: () => api<{ items: any[] }>('/api/applications'),
  });

  const isDirty = React.useMemo(() => {
    if (!matrixData?.items || localItems.length === 0) return false;
    return JSON.stringify(localItems) !== JSON.stringify(matrixData.items);
  }, [localItems, matrixData?.items]);

  const blocker = useUnsavedChanges(isDirty);

  const saveMutation = useMutation({
    mutationFn: (item: Partial<RCMMatrixItem>) => 
      api('/api/rcm-matrix/itgc/batch-update', { 
        method: 'POST', 
        body: JSON.stringify({ items: [item] }) 
      }),
    onSuccess: () => {
      toast.success(t('matrix.save_success'));
      queryClient.invalidateQueries({ queryKey: ['rcm-matrix-itgc'] });
      setEditingMappingId(null);
    }
  });

  const handleInputChange = (id: string, field: keyof RCMMatrixItem, value: any) => {
    setLocalItems(prev => prev.map(item => 
      item.mappingId === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSave = (id: string) => {
    const item = localItems.find(i => i.mappingId === id);
    if (!item) return;
    saveMutation.mutate({
      id: item.mappingId,
      controlName: item.mappedControlName,
      controlDescription: item.mappedControlDescription,
      itgcDomain: item.itgcDomain,
      controlType: item.controlType,
      controlNature: item.controlNature,
      automatedSubNature: item.automatedSubNature,
      frequency: item.frequency,
      isKeyControl: item.isKeyControl,
      supportingDocs: item.supportingDocs,
      supportingApp: item.supportingApp,
      executingFunction: item.executingFunction,
      executorRole: item.executorRole,
      affectedFsliItem: item.affectedFsliItem,
      effectivePeriod: item.effectivePeriod,
    });
  };

  const filteredItems = localItems.filter(item => 
    item.processName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.riskDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.mappedControlName || item.baseControlName)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const content = (
    <div className="flex flex-col h-full overflow-hidden max-w-full">
      {!embedded && (
        <RCMPageHeader 
          title={t('rcm:itgc.title')}
          subtitle="Regulatory Compliance Matrix - ITGC (Lampiran 5.c)"
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['rcm-matrix-itgc'] })}
          metadata={[
            { label: t('matrix.company'), value: localItems[0]?.companyName || "N/A" },
            { label: t('matrix.location'), value: localItems[0]?.locationCode || "N/A" }
          ]}
        />
      )}
      <div className="flex-1 p-0">
        <div className="w-full border-t border-b bg-white border-slate-200 relative">
          <Table className="min-w-[3800px] table-fixed border-separate border-spacing-0">
            <TableHeader className="sticky top-0 z-50 bg-slate-100">
              <TableRow className="divide-x divide-slate-200 h-10">
                <TableHead className="w-[50px] font-black uppercase text-[10px] text-center sticky left-0 z-[60] bg-slate-100 border-r-2 border-slate-300">i. No</TableHead>
                <TableHead className="w-[260px] font-black uppercase text-[10px] sticky left-[50px] z-[60] bg-slate-100 border-r-2 border-slate-300 text-indigo-700 px-3">ii. {t('matrix.process_info')}</TableHead>
                <TableHead className="w-[200px] font-black uppercase text-[10px] sticky left-[310px] z-[60] bg-slate-100 border-r-2 border-slate-300 px-3">iii. {t('matrix.sub_process')}</TableHead>
                <TableHead className="w-[180px] font-black uppercase text-[10px] bg-slate-100 px-3">iv. {t('matrix.company')}</TableHead>
                <TableHead className="w-[90px] font-black uppercase text-[10px] bg-slate-100 text-center px-2">v. {t('matrix.location')}</TableHead>
                <TableHead className="w-[380px] font-black uppercase text-[10px] bg-slate-100 px-3">vi. {t('matrix.risk_description')}</TableHead>
                <TableHead className="w-[130px] font-black uppercase text-[10px] bg-slate-100 px-3">vii. {t('matrix.control_ref')}</TableHead>
                <TableHead className="w-[320px] font-black uppercase text-[10px] bg-slate-100 px-3">viii. {t('matrix.control_name')}</TableHead>
                <TableHead className="w-[450px] font-black uppercase text-[10px] bg-slate-100 px-3">ix. {t('matrix.control_description')}</TableHead>
                <TableHead className="w-[220px] font-black uppercase text-[10px] bg-slate-100 px-3">x. {t('matrix.supporting_docs')}</TableHead>
                <TableHead className="w-[90px] text-center font-black uppercase text-[10px] bg-slate-100">xi. Utama?</TableHead>
                <TableHead className="w-[120px] font-black uppercase text-[10px] bg-slate-100 text-center px-3">xii. Prev/Det</TableHead>
                <TableHead className="w-[120px] font-black uppercase text-[10px] bg-slate-100 text-center px-3">xiii. Sifat</TableHead>
                <TableHead className="w-[180px] font-black uppercase text-[10px] bg-slate-100 text-center px-3">xiv. Jenis Otomatis</TableHead>
                <TableHead className="w-[130px] font-black uppercase text-[10px] bg-slate-100 text-center px-3">xv. Frekuensi</TableHead>
                <TableHead className="w-[160px] font-black uppercase text-[10px] bg-slate-100 text-center px-3">xvi. Aplikasi</TableHead>
                <TableHead className="w-[180px] font-black uppercase text-[10px] bg-slate-100 text-center px-3">xvii. Fungsi Pelaksana</TableHead>
                <TableHead className="w-[160px] font-black uppercase text-[10px] bg-slate-100 text-center px-3">xviii. Pelaku</TableHead>
                <TableHead className="w-[130px] font-black uppercase text-[10px] bg-slate-100 text-center px-3">xix. Periode Efektif</TableHead>
                <TableHead className="w-[100px] font-black uppercase text-[10px] sticky right-0 z-[60] bg-slate-100">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item, idx) => {
                const isEditing = editingMappingId === item.mappingId;
                return (
                  <TableRow key={item.mappingId} className="group transition-colors border-b border-slate-100 hover:bg-slate-50/50 h-11">
                    <TableCell className="sticky left-0 z-30 bg-white border-r border-slate-200">
                      <InlineEditRow 
                        isEditing={isEditing}
                        onEdit={() => setEditingMappingId(item.mappingId)}
                        onSave={() => handleSave(item.mappingId)}
                        onCancel={() => setEditingMappingId(null)}
                      />
                    </TableCell>
                    <TableCell className="align-top font-bold text-slate-800 text-[10px] sticky left-[50px] z-30 bg-white border-r border-slate-200">
                      <div className="flex flex-col gap-0 pr-2 pt-1 leading-tight">
                        <span className="uppercase tracking-tighter text-indigo-600 text-[9px] font-black">{item.fsliName} {item.bpmCode && `[${item.bpmCode}]`}</span>
                        <span className="line-clamp-2">{item.noGL} - {item.processName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="align-top font-bold text-slate-600 text-[10px] sticky left-[310px] z-30 bg-white border-r border-slate-200">{item.subProcessName}</TableCell>
                    <TableCell className="text-[10px] text-slate-600 px-3">{item.companyName}</TableCell>
                    <TableCell className="text-[10px] text-slate-600 text-center">{item.locationCode}</TableCell>
                    <TableCell className="text-[10px] text-slate-700 px-3">{item.riskDescription}</TableCell>
                    <TableCell className="text-[10px] font-bold text-indigo-700 px-3">{item.controlCode}</TableCell>
                    <TableCell className="text-[10px] text-slate-800 px-3">{isEditing ? <Input value={item.mappedControlName || item.baseControlName || ''} onChange={e => handleInputChange(item.mappingId, 'mappedControlName', e.target.value)} /> : (item.mappedControlName || item.baseControlName)}</TableCell>
                    <TableCell className="text-[10px] text-slate-600 italic px-3">{isEditing ? <Input value={item.mappedControlDescription || item.baseControlDescription || ''} onChange={e => handleInputChange(item.mappingId, 'mappedControlDescription', e.target.value)} /> : (item.mappedControlDescription || item.baseControlDescription)}</TableCell>
                    <TableCell className="text-[10px] text-slate-500 px-3">{item.supportingDocs}</TableCell>
                    <TableCell className="text-center"><Check className={cn("h-4 w-4 mx-auto", item.isKeyControl ? "text-indigo-600" : "text-slate-200")} /></TableCell>
                    <TableCell className="text-[10px] font-medium px-3">{item.controlType}</TableCell>
                    <TableCell className="text-[10px] font-medium px-3">{item.controlNature}</TableCell>
                    <TableCell className="text-[10px] font-medium px-3">{item.automatedSubNature || '-'}</TableCell>
                    <TableCell className="text-[10px] font-medium px-3 text-center">{item.frequency}</TableCell>
                    <TableCell className="text-[10px] font-medium px-3">{item.supportingApp || '-'}</TableCell>
                    <TableCell className="text-[10px] font-medium px-3">{item.executingFunction}</TableCell>
                    <TableCell className="text-[10px] font-medium px-3">{item.executorRole}</TableCell>
                    <TableCell className="text-[10px] font-medium px-3">{item.effectivePeriod}</TableCell>
                    <TableCell className="sticky right-0 z-30 bg-white" />
                  </TableRow>
                );
              })}
            </TableBody>          </Table>
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout container={false} className="bg-slate-100/30">
      {content}
      <UnsavedChangesDialog blocker={blocker} />
    </AppLayout>
  );
}
