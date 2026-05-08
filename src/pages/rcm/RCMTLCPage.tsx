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
  Search, Save, Loader2, AlertTriangle, Filter, Check
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
  // ...

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
}

interface RCMTLCPageProps {
  embedded?: boolean;
  filterBpmId?: string;
}

export function RCMTLCPage({ embedded = false, filterBpmId }: RCMTLCPageProps) {
  const { t } = useTranslation(['rcm', 'common']);
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [localItems, setLocalItems] = React.useState<RCMMatrixItem[]>([]);

  const { data: matrixData, isLoading } = useQuery({
    queryKey: ['rcm-matrix-tlc', filterBpmId],
    queryFn: async () => {
      const url = filterBpmId ? `/api/rcm-matrix/tlc?bpmProcessId=${filterBpmId}` : '/api/rcm-matrix/tlc';
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
      api('/api/rcm-matrix/tlc/batch-update', { 
        method: 'POST', 
        body: JSON.stringify({ items }) 
      }),
    onSuccess: () => {
      toast.success(t('matrix.save_success'));
      queryClient.invalidateQueries({ queryKey: ['rcm-matrix-tlc'] });
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
      ipoC: item.ipoC,
      ipoA: item.ipoA,
      ipoV: item.ipoV,
      ipoRa: item.ipoRa,
      assertionE: item.assertionE,
      assertionC: item.assertionC,
      assertionA: item.assertionA,
      assertionCo: item.assertionCo,
      assertionVa: item.assertionVa,
      assertionRo: item.assertionRo,
      assertionPd: item.assertionPd,
      controlType: item.controlType,
      controlNature: item.controlNature,
      automatedType: item.automatedType,
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

  const [editingMappingId, setEditingMappingId] = React.useState<string | null>(null);

  const handleEditClick = (mappingId: string) => {
    setEditingMappingId(mappingId === editingMappingId ? null : mappingId);
  };

  const isAnyEditing = editingMappingId !== null;

  const content = (

    <div className="flex flex-col h-full overflow-hidden max-w-full">
      {!embedded && (
        <>
          {/* Header - Fixed */}
          <div className="p-4 pb-2 space-y-3 shrink-0 bg-white/80 backdrop-blur-md border-b z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">{t('matrix.title_tlc')}</h1>
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">SK-5/DKU.MBU/11/2024 Regulatory Compliance Matrix</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="xs" onClick={() => queryClient.invalidateQueries({ queryKey: ['rcm-matrix-tlc'] })} className="bg-white h-7 text-[10px] font-bold">
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
                  placeholder="Search matrix..." 
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
        </>
      )}

      {/* Matrix Area - Scrollable */}
      <div className="flex-1 p-0">
        <div className="w-full border-t border-b bg-white border-slate-200 relative">
          <Table className="min-w-[4800px] table-fixed border-separate border-spacing-0">
            <TableHeader className="sticky top-0 z-50">
              <TableRow className="divide-x divide-slate-200 bg-slate-100 h-10">
                {/* Fixed Columns Header */}
                <TableHead className="w-[50px] font-black uppercase text-[10px] text-center sticky left-0 z-[60] bg-slate-100 border-r-2 border-slate-300">i. No</TableHead>
                <TableHead className="w-[260px] font-black uppercase text-[10px] sticky left-[50px] z-[60] bg-slate-100 border-r-2 border-slate-300 text-indigo-700 px-3">ii. {t('matrix.process_info')}</TableHead>
                <TableHead className="w-[200px] font-black uppercase text-[10px] sticky left-[310px] z-[60] bg-slate-100 border-r-2 border-slate-300 px-3">iii. {t('matrix.sub_process')}</TableHead>
                
                {/* Floating Columns Header */}
                <TableHead className="w-[180px] font-black uppercase text-[10px] bg-slate-100 px-3">iv. {t('matrix.company')}</TableHead>
                <TableHead className="w-[90px] font-black uppercase text-[10px] bg-slate-100 text-center px-2">v. {t('matrix.location')}</TableHead>
                <TableHead className="w-[380px] font-black uppercase text-[10px] bg-slate-100 px-3">vi. {t('matrix.risk_description')}</TableHead>
                <TableHead className="w-[70px] text-center font-black uppercase text-[10px] bg-slate-100">vii. Fraud</TableHead>
                <TableHead className="w-[110px] text-center font-black uppercase text-[10px] bg-slate-100">viii. {t('matrix.risk_rating')}</TableHead>
                <TableHead className="w-[130px] font-black uppercase text-[10px] bg-slate-100 px-3">ix. {t('matrix.control_ref')}</TableHead>
                <TableHead className="w-[320px] font-black uppercase text-[10px] bg-slate-100 px-3">x. {t('matrix.control_name')}</TableHead>
                <TableHead className="w-[450px] font-black uppercase text-[10px] bg-slate-100 px-3">xi. {t('matrix.control_description')}</TableHead>
                <TableHead className="w-[220px] font-black uppercase text-[10px] bg-slate-100 px-3">xii. {t('matrix.supporting_docs')}</TableHead>
                <TableHead className="w-[90px] text-center font-black uppercase text-[10px] bg-slate-100">xiii. Utama?</TableHead>
                
                <TableHead className="w-[200px] bg-blue-700 text-white font-black uppercase text-[10px] text-center border-l-4 border-blue-800" colSpan={4}>IPO (xiv-xvii)</TableHead>
                <TableHead className="w-[350px] bg-indigo-700 text-white font-black uppercase text-[10px] text-center border-l-4 border-indigo-800" colSpan={7}>{t('matrix.assertions')} (xviii-xxiv)</TableHead>
                
                <TableHead className="w-[160px] font-black uppercase text-[10px] bg-slate-100 px-3">xxv. {t('matrix.type')}</TableHead>
                <TableHead className="w-[180px] font-black uppercase text-[10px] bg-slate-100 px-3">xxvi. {t('matrix.nature')}</TableHead>
                <TableHead className="w-[200px] font-black uppercase text-[10px] bg-slate-100 px-3">xxvii. {t('matrix.automated_type')}</TableHead>
                <TableHead className="w-[130px] font-black uppercase text-[10px] bg-slate-100 text-center px-3">xxviii. {t('matrix.frequency')}</TableHead>
                <TableHead className="w-[180px] font-black uppercase text-[10px] bg-slate-100 px-3">xxix. {t('matrix.supporting_app')}</TableHead>
                <TableHead className="w-[180px] font-black uppercase text-[10px] bg-slate-100 px-3">xxx. {t('matrix.executing_function')}</TableHead>
                <TableHead className="w-[180px] font-black uppercase text-[10px] bg-slate-100 px-3">xxxi. {t('matrix.executor_role')}</TableHead>
                <TableHead className="w-[220px] font-black uppercase text-[10px] bg-slate-100 px-3">xxxii. {t('matrix.affected_fsli_item')}</TableHead>
                <TableHead className="w-[130px] font-black uppercase text-[10px] bg-slate-100 text-center px-3">xxxiii. {t('matrix.effective_period')}</TableHead>
                <TableHead className="w-[100px] font-black uppercase text-[10px] bg-slate-100 text-center sticky right-0 z-[60] border-l-2 border-slate-300">Action</TableHead>
              </TableRow>
              
              {/* Sub-Header Row */}
              <TableRow className="divide-x divide-slate-200 text-[9px] bg-slate-50 h-8">
                 <TableHead className="sticky left-0 z-[60] bg-slate-50 border-r-2 border-slate-300"></TableHead>
                 <TableHead className="sticky left-[50px] z-[60] bg-slate-50 border-r-2 border-slate-300"></TableHead>
                 <TableHead className="sticky left-[310px] z-[60] bg-slate-50 border-r-2 border-slate-300"></TableHead>
                 <TableHead colSpan={10} className="bg-slate-50/30"></TableHead>
                 
                 <TableHead className="text-center bg-blue-600 text-white border-l-4 border-blue-800 font-bold">C</TableHead>
                 <TableHead className="text-center bg-blue-600 text-white font-bold">A</TableHead>
                 <TableHead className="text-center bg-blue-600 text-white font-bold">V</TableHead>
                 <TableHead className="text-center bg-blue-600 text-white font-bold">RA</TableHead>

                 <TableHead className="text-center bg-indigo-600 text-white border-l-4 border-indigo-800 font-bold">E/O</TableHead>
                 <TableHead className="text-center bg-indigo-600 text-white font-bold">C</TableHead>
                 <TableHead className="text-center bg-indigo-600 text-white font-bold">A</TableHead>
                 <TableHead className="text-center bg-indigo-600 text-white font-bold">CO</TableHead>
                 <TableHead className="text-center bg-indigo-600 text-white font-bold">R&O</TableHead>
                 <TableHead className="text-center bg-indigo-600 text-white font-bold">V/A</TableHead>
                 <TableHead className="text-center bg-indigo-600 text-white font-bold">PD</TableHead>
                 <TableHead colSpan={9} className="bg-slate-50/30"></TableHead>
                 <TableHead className="sticky right-0 z-[60] bg-slate-50 border-l-2 border-slate-300"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={34} className="h-64 text-center">Loading matrix data...</TableCell></TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow><TableCell colSpan={34} className="h-64 text-center italic text-slate-400">No RCM relationships found.</TableCell></TableRow>
              ) : filteredItems.flatMap((item, idx) => {
                const originalItem = matrixData?.items?.find(o => o.mappingId === item.mappingId);
                const isFirstOfProcess = idx === 0 || item.noGL !== filteredItems[idx-1].noGL;
                const isFirstOfSub = idx === 0 || item.subProcessName !== filteredItems[idx-1].subProcessName;
                const isFirstOfRisk = idx === 0 || item.riskDescription !== filteredItems[idx-1].riskDescription;

                const isEditing = editingMappingId === item.mappingId;
                const isFrozen = isAnyEditing && !isEditing;

                const isFieldDirty = (field: keyof RCMMatrixItem) => 
                   originalItem && JSON.stringify(item[field]) !== JSON.stringify(originalItem[field]);

                const mainRow = (
                  <TableRow key={`${item.mappingId}-${idx}`} className={cn(
                    "group transition-colors divide-x divide-slate-100 h-10",
                    isEditing ? "bg-blue-50/50 ring-2 ring-blue-500 ring-inset z-10" : "hover:bg-indigo-50/5",
                    isFrozen && "opacity-50 pointer-events-none grayscale-[0.5]"
                  )}>
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
                    <TableCell className="text-center align-top pt-2 bg-slate-50/30">
                      {item.isFraudRelated && <AlertTriangle className="h-3 w-3 text-rose-500 mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center align-top pt-2">
                      <Badge className={cn("text-[9px] font-black px-1.5 h-4 leading-none uppercase", 
                        item.riskRating === 'High' ? "bg-rose-100 text-rose-700" : 
                        item.riskRating === 'Medium' ? "bg-amber-100 text-amber-700" : 
                        "bg-emerald-100 text-emerald-700"
                      )}>{item.riskRating}</Badge>
                    </TableCell>

                    <TableCell className="align-top font-mono text-[10px] pt-2 font-bold text-indigo-700 px-3 bg-slate-50/30">
                      {item.controlCode}
                    </TableCell>
                    <TableCell className="align-top text-[10px] text-slate-800 px-3 pt-2">{item.mappedControlName || item.baseControlName}</TableCell>
                    <TableCell className="align-top text-[10px] text-slate-600 italic px-3 pt-2 line-clamp-2">{item.mappedControlDescription || item.baseControlDescription}</TableCell>

                    <TableCell className="align-top text-[10px] text-slate-500 px-3 pt-2 truncate">{item.supportingDocs}</TableCell>
                    <TableCell className="text-center align-top pt-2 px-3">
                       <Check className={cn("h-4 w-4 mx-auto", item.isKeyControl ? "text-indigo-600" : "text-slate-200")} />
                    </TableCell>

                    {/* IPO Indicators */}
                    {['ipoC', 'ipoA', 'ipoV', 'ipoRa'].map((f) => (
                      <TableCell key={f} className={cn("text-center text-[10px] font-black border-slate-200", f === 'ipoC' && "border-l-4 border-blue-300", item[f as keyof RCMMatrixItem] ? "text-blue-700 bg-blue-50/30" : "text-slate-200")}>
                         {item[f as keyof RCMMatrixItem] || '—'}
                      </TableCell>
                    ))}

                    {/* Assertion Indicators */}
                    {['assertionE', 'assertionC', 'assertionA', 'assertionCo', 'assertionRo', 'assertionVa', 'assertionPd'].map((f) => (
                      <TableCell key={f} className={cn("text-center text-[10px] font-black border-slate-200", f === 'assertionE' && "border-l-4 border-indigo-300", item[f as keyof RCMMatrixItem] ? "text-indigo-700 bg-indigo-50/30" : "text-slate-200")}>
                         {item[f as keyof RCMMatrixItem] || '—'}
                      </TableCell>
                    ))}

                    <TableCell className="text-[10px] font-medium px-3">{item.controlType}</TableCell>
                    <TableCell className="text-[10px] font-medium px-3 bg-slate-50/30">{item.controlNature}</TableCell>
                    <TableCell className="text-[10px] font-medium px-3">{item.automatedType || '-'}</TableCell>
                    <TableCell className="text-[10px] font-medium px-3 text-center">{item.frequency}</TableCell>
                    <TableCell className="text-[10px] font-medium px-3 bg-slate-50/30">{item.supportingApp || '-'}</TableCell>
                    <TableCell className="text-[10px] font-medium px-3">{item.executingFunction}</TableCell>
                    <TableCell className="text-[10px] font-medium px-3 bg-slate-50/30">{item.executorRole}</TableCell>
                    <TableCell className="text-[10px] font-mono font-medium px-3 truncate">{item.affectedFsliItem}</TableCell>
                    <TableCell className="text-[10px] text-center font-bold text-indigo-600 bg-slate-50/30">{item.effectivePeriod}</TableCell>
                    
                    <TableCell className="text-center sticky right-0 z-30 bg-white border-l-2 border-slate-200">
                       <Button 
                         variant={isEditing ? "destructive" : "ghost"} 
                         size="xs" 
                         className="h-7 text-[10px] font-bold"
                         onClick={() => handleEditClick(item.mappingId)}
                       >
                         {isEditing ? "Cancel" : "Edit"}
                       </Button>
                    </TableCell>
                  </TableRow>
                );

                if (!isEditing) return [mainRow];

                const editRow = (
                  <TableRow key={`${item.mappingId}-edit`} className="bg-blue-50/80 border-b-4 border-blue-400">
                    <TableCell colSpan={9} className="bg-blue-100/50 border-r-2 border-blue-200">
                       <div className="px-4 py-2">
                          <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest mb-1">Inline Editing Control: {item.controlCode}</p>
                          <p className="text-[10px] text-blue-900 font-bold">Modify fields in the row below. Other rows are frozen.</p>
                       </div>
                    </TableCell>
                    <TableCell className="p-0">
                       <Input 
                         className="h-10 border-none focus-visible:ring-0 text-[10px] px-3 font-bold bg-white" 
                         value={item.mappedControlName || item.baseControlName || ''} 
                         onChange={e => handleInputChange(item.mappingId, 'mappedControlName', e.target.value)} 
                         placeholder="Control Name..."
                       />
                    </TableCell>
                    <TableCell className="p-0">
                       <Input 
                         className="h-10 border-none focus-visible:ring-0 text-[10px] px-3 italic bg-white" 
                         value={item.mappedControlDescription || item.baseControlDescription || ''} 
                         onChange={e => handleInputChange(item.mappingId, 'mappedControlDescription', e.target.value)} 
                         placeholder="Control Description..."
                       />
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-10 border-none focus-visible:ring-0 text-[10px] px-3 bg-white" value={item.supportingDocs || ''} onChange={e => handleInputChange(item.mappingId, 'supportingDocs', e.target.value)} placeholder="Supporting Docs..." />
                    </TableCell>
                    <TableCell className="text-center align-middle bg-white">
                       <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 cursor-pointer" checked={item.isKeyControl} onChange={e => handleInputChange(item.mappingId, 'isKeyControl', e.target.checked)} />
                    </TableCell>
                    
                    {/* IPO Inputs */}
                    {['ipoC', 'ipoA', 'ipoV', 'ipoRa'].map((f) => (
                      <TableCell key={f} className="p-0 bg-white">
                         <Input className="h-10 border-none focus-visible:ring-0 text-center text-[10px] uppercase font-black" value={item[f as keyof RCMMatrixItem] || ''} onChange={e => handleInputChange(item.mappingId, f as any, e.target.value)} maxLength={1} />
                      </TableCell>
                    ))}

                    {/* Assertion Inputs */}
                    {['assertionE', 'assertionC', 'assertionA', 'assertionCo', 'assertionRo', 'assertionVa', 'assertionPd'].map((f) => (
                      <TableCell key={f} className="p-0 bg-white">
                         <Input className="h-10 border-none focus-visible:ring-0 text-center text-[10px] uppercase font-black" value={item[f as keyof RCMMatrixItem] || ''} onChange={e => handleInputChange(item.mappingId, f as any, e.target.value)} maxLength={1} />
                      </TableCell>
                    ))}

                    <TableCell className="p-0 bg-white">
                       <Select value={item.controlType || ''} onValueChange={val => handleInputChange(item.mappingId, 'controlType', val)}>
                         <SelectTrigger className="h-10 border-none rounded-none focus:ring-0 text-[10px] shadow-none px-3 font-medium"><SelectValue /></SelectTrigger>
                         <SelectContent><SelectItem value="Preventif" className="text-[10px]">Preventif</SelectItem><SelectItem value="Detektif" className="text-[10px]">Detektif</SelectItem></SelectContent>
                       </Select>
                    </TableCell>
                    <TableCell colSpan={7} className="bg-blue-50/30 text-right pr-4">
                       <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-7 text-[10px] font-bold shadow-lg" onClick={() => setEditingMappingId(null)}>
                          Finish Editing
                       </Button>
                    </TableCell>
                    <TableCell className="sticky right-0 z-30 bg-white" />
                  </TableRow>
                );

                return [mainRow, editRow];
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
