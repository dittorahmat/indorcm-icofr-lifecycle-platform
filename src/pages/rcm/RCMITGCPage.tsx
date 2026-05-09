import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { RCMControlMapping } from '@shared/types';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Save, Loader2, AlertTriangle, Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';

interface RCMMatrixItem extends RCMControlMapping {
  mappingId: string;
  processName: string;
  bpmCode?: string; // New
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
    mutationFn: (items: Partial<RCMMatrixItem>[]) => 
      api('/api/rcm-matrix/itgc/batch-update', { 
        method: 'POST', 
        body: JSON.stringify({ items }) 
      }),
    onSuccess: () => {
      toast.success(t('matrix.save_success'));
      queryClient.invalidateQueries({ queryKey: ['rcm-matrix-itgc'] });
    }
  });

  const handleInputChange = (id: string, field: keyof RCMMatrixItem, value: any) => {
    setLocalItems(prev => prev.map(item => 
      item.mappingId === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSave = () => {
    const payload = localItems.map(item => ({
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
    }));
    saveMutation.mutate(payload);
  };

  const filteredItems = localItems.filter(item => 
    item.processName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.riskDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.mappedControlName || item.baseControlName)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const content = (
    <div className="flex flex-col h-full overflow-hidden max-w-full">
      {!embedded && (
        <div className="p-4 pb-2 space-y-3 shrink-0 bg-white/80 backdrop-blur-md border-b z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">{t('rcm:itgc.title')}</h1>
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">Regulatory Compliance Matrix - ITGC (Lampiran 5.c)</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="xs" onClick={() => queryClient.invalidateQueries({ queryKey: ['rcm-matrix-itgc'] })} className="bg-white h-7 text-[10px] font-bold">
                <Filter className="h-3 w-3 mr-1.5" /> Refresh
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending} size="xs" className="bg-indigo-600 hover:bg-indigo-700 shadow-md h-7 text-[10px] font-bold px-4">
                {saveMutation.isPending ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Save className="h-3 w-3 mr-1.5" />}
                {t('common:actions.save')}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
             <div className="relative max-w-md w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder="Search ITGC matrix..." 
                className="pl-8 bg-white border-slate-200 h-8 text-[11px] font-medium" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <div className="flex gap-4 items-center bg-slate-100/50 px-3 py-1 rounded-lg border border-slate-200">
               <div className="text-right">
                  <p className="text-[8px] text-slate-400 font-black uppercase tracking-wider leading-none">{t('matrix.company')}</p>
                  <p className="text-[10px] font-bold text-slate-700">{localItems[0]?.companyName || "N/A"}</p>
               </div>
               <div className="w-px h-4 bg-slate-300" />
               <div className="text-right">
                  <p className="text-[8px] text-slate-400 font-black uppercase tracking-wider leading-none">{t('matrix.location')}</p>
                  <p className="text-[10px] font-bold text-slate-700">{localItems[0]?.locationCode || "N/A"}</p>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Matrix Area - Scrollable */}
      <div className="flex-1 p-0">
        <div className="w-full border-t border-b bg-white border-slate-200 relative">
          <Table className="min-w-[3800px] table-fixed border-separate border-spacing-0">
            <TableHeader className="sticky top-0 z-50">
              <TableRow className="divide-x divide-slate-200 bg-slate-100 h-10">
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={19} className="h-64 text-center">Loading ITGC matrix data...</TableCell></TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow><TableCell colSpan={19} className="h-64 text-center italic text-slate-400">No ITGC mappings found.</TableCell></TableRow>
              ) : filteredItems.map((item, idx) => {
                const originalItem = matrixData?.items?.find(o => o.mappingId === item.mappingId);
                const isFirstOfProcess = idx === 0 || item.noGL !== filteredItems[idx-1].noGL;
                const isFirstOfSub = idx === 0 || item.subProcessName !== filteredItems[idx-1].subProcessName;
                const isFirstOfRisk = idx === 0 || item.riskDescription !== filteredItems[idx-1].riskDescription;

                const isFieldDirty = (field: keyof RCMMatrixItem) => 
                   originalItem && JSON.stringify(item[field]) !== JSON.stringify(originalItem[field]);

                return (
                  <TableRow key={`${item.mappingId}-${idx}`} className="group hover:bg-indigo-50/5 transition-colors divide-x divide-slate-100 h-10">
                    <TableCell className="text-center text-[10px] font-black text-slate-400 sticky left-0 z-30 bg-white border-r-2 border-slate-200">
                       {idx + 1}
                    </TableCell>
                    <TableCell className={cn("align-top font-bold text-slate-800 text-[10px] sticky left-[50px] z-30 bg-white border-r-2 border-slate-200", !isFirstOfProcess && "text-transparent border-none")}>
                      <div className="flex flex-col gap-0 pr-2 pt-1 leading-tight">
                        <span className="uppercase tracking-tighter text-indigo-600 text-[9px] font-black">
                          {item.fsliName} {item.bpmCode && `[${item.bpmCode}]`}
                        </span>
                        <span className="line-clamp-2">{item.noGL} - {item.processName}</span>
                      </div>
                    </TableCell>
                    <TableCell className={cn("align-top font-bold text-slate-600 text-[10px] sticky left-[310px] z-30 bg-white border-r-2 border-slate-200", !isFirstOfSub && "text-transparent border-none")}>
                      <div className="pt-1">{item.subProcessName}</div>
                    </TableCell>
                    
                    <TableCell className="align-top text-[10px] text-slate-600 px-3 pt-2">{item.companyName}</TableCell>
                    <TableCell className="align-top text-[10px] text-slate-600 font-mono px-2 pt-2 text-center bg-slate-50/30">{item.locationCode}</TableCell>
                    
                    <TableCell className={cn("align-top text-[10px] text-slate-700 px-3 pt-2 leading-tight", !isFirstOfRisk && "opacity-30")}>
                      {item.riskDescription}
                    </TableCell>

                    <TableCell className="align-top font-mono text-[10px] pt-2 font-bold text-indigo-700 px-3 bg-slate-50/30">
                      {item.controlCode}
                    </TableCell>
                    <TableCell className={cn("p-0 relative", isFieldDirty('mappedControlName') && "bg-blue-50/30")}>
                       <Input 
                         className="h-full border-none focus-visible:ring-0 text-[10px] px-3 font-bold text-slate-800 bg-transparent" 
                         value={item.mappedControlName || item.baseControlName || ''} 
                         onChange={e => handleInputChange(item.mappingId, 'mappedControlName', e.target.value)} 
                       />
                       {isFieldDirty('mappedControlName') && <div className="absolute right-0 top-0 w-1 h-full bg-blue-500" />}
                    </TableCell>
                    <TableCell className={cn("p-0 relative", isFieldDirty('mappedControlDescription') && "bg-blue-50/30")}>
                       <Input 
                         className="h-full border-none focus-visible:ring-0 text-[10px] px-3 text-slate-600 italic bg-transparent" 
                         value={item.mappedControlDescription || item.baseControlDescription || ''} 
                         onChange={e => handleInputChange(item.mappingId, 'mappedControlDescription', e.target.value)} 
                       />
                       {isFieldDirty('mappedControlDescription') && <div className="absolute right-0 top-0 w-1 h-full bg-blue-500" />}
                    </TableCell>

                    <TableCell className={cn("p-0 bg-slate-50/30 relative", isFieldDirty('supportingDocs') && "bg-blue-50/30")}>
                       <Input className="h-full border-none focus-visible:ring-0 text-[10px] px-3 bg-transparent" value={item.supportingDocs || ''} onChange={e => handleInputChange(item.mappingId, 'supportingDocs', e.target.value)} placeholder="Link..." />
                       {isFieldDirty('supportingDocs') && <div className="absolute right-0 top-0 w-1 h-full bg-blue-500" />}
                    </TableCell>
                    <TableCell className="text-center align-top pt-2 px-3">
                       <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 cursor-pointer" checked={item.isKeyControl} onChange={e => handleInputChange(item.mappingId, 'isKeyControl', e.target.checked)} />
                    </TableCell>

                    <TableCell className="p-0">
                       <Select value={item.controlType || ''} onValueChange={val => handleInputChange(item.mappingId, 'controlType', val)}>
                         <SelectTrigger className="h-full border-none rounded-none focus:ring-0 text-[10px] shadow-none px-3 font-medium"><SelectValue placeholder="..." /></SelectTrigger>
                         <SelectContent><SelectItem value="Preventif" className="text-[10px]">Preventif</SelectItem><SelectItem value="Detektif" className="text-[10px]">Detektif</SelectItem></SelectContent>
                       </Select>
                    </TableCell>
                    <TableCell className="p-0">
                       <Select value={item.controlNature || ''} onValueChange={val => handleInputChange(item.mappingId, 'controlNature', val)}>
                         <SelectTrigger className="h-full border-none rounded-none focus:ring-0 text-[10px] shadow-none px-3 font-medium"><SelectValue placeholder="..." /></SelectTrigger>
                         <SelectContent>
                            {['Manual', 'Otomatis', 'ITDM - EUC', 'ITDM - IPE', 'MRC'].map(v => <SelectItem key={v} value={v} className="text-[10px]">{v}</SelectItem>)}
                         </SelectContent>
                       </Select>
                    </TableCell>
                    <TableCell className="p-0 bg-indigo-50/30">
                       <Select value={item.automatedSubNature || ''} onValueChange={val => handleInputChange(item.mappingId, 'automatedSubNature', val)} disabled={item.controlNature !== 'Otomatis' && !item.controlNature?.includes('ITDM')}>
                         <SelectTrigger className="h-full border-none rounded-none focus:ring-0 text-[10px] font-bold text-indigo-700 shadow-none px-3 italic"><SelectValue placeholder="..." /></SelectTrigger>
                         <SelectContent>
                            {['Automated Control', 'Automated Calculation', 'Restricted Access', 'Interface'].map(v => <SelectItem key={v} value={v} className="text-[10px]">{v}</SelectItem>)}
                         </SelectContent>
                       </Select>
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-[10px] px-3 font-medium" value={item.frequency || ''} onChange={e => handleInputChange(item.mappingId, 'frequency', e.target.value)} placeholder="..." />
                    </TableCell>
                    <TableCell className="p-0 bg-indigo-50/30">
                       <Select value={item.supportingApp || ''} onValueChange={val => handleInputChange(item.mappingId, 'supportingApp', val)}>
                         <SelectTrigger className="h-full border-none rounded-none focus:ring-0 text-[10px] shadow-none px-3 font-bold text-indigo-700"><SelectValue placeholder="..." /></SelectTrigger>
                         <SelectContent>
                           {(appsData?.items || []).map(app => <SelectItem key={app.id} value={app.name} className="text-[10px]">{app.name}</SelectItem>)}
                         </SelectContent>
                       </Select>
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-[10px] px-3 font-medium" value={item.executingFunction || ''} onChange={e => handleInputChange(item.mappingId, 'executingFunction', e.target.value)} placeholder="..." />
                    </TableCell>
                    <TableCell className="p-0 bg-slate-50/30">
                       <Input className="h-full border-none focus-visible:ring-0 text-[10px] px-3 font-medium" value={item.executorRole || ''} onChange={e => handleInputChange(item.mappingId, 'executorRole', e.target.value)} placeholder="..." />
                    </TableCell>
                    <TableCell className="p-0 bg-slate-50/30">
                       <Input className="h-full border-none focus-visible:ring-0 text-[10px] px-3 text-center font-bold text-indigo-600" value={item.effectivePeriod || ''} onChange={e => handleInputChange(item.mappingId, 'effectivePeriod', e.target.value)} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <AppLayout container={false} className="bg-slate-100/30">
      {content}
      <UnsavedChangesDialog blocker={blocker} />
    </AppLayout>
  );
}
