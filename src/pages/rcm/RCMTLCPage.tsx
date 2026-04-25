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
}

export function RCMTLCPage() {
  const { t } = useTranslation(['rcm', 'common']);
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [localItems, setLocalItems] = React.useState<RCMMatrixItem[]>([]);

  const { data: matrixData, isLoading } = useQuery({
    queryKey: ['rcm-matrix-tlc'],
    queryFn: async () => {
      const res = await api<{ items: RCMMatrixItem[] }>('/api/rcm-matrix/tlc');
      setLocalItems(res.items);
      return res;
    },
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

  return (
    <AppLayout container={false} className="bg-slate-100/30">
      <div className="flex flex-col h-screen max-h-screen overflow-hidden max-w-full">
        {/* Header - Fixed */}
        <div className="p-6 pb-2 space-y-4 shrink-0 bg-white/80 backdrop-blur-md border-b z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">{t('matrix.title_tlc')}</h1>
              <p className="text-muted-foreground text-xs font-medium">SK-5/DKU.MBU/11/2024 Regulatory Compliance Matrix</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['rcm-matrix-tlc'] })} className="bg-white">
                <Filter className="h-4 w-4 mr-2" /> Refresh
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending} size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {t('common:actions.save')}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
             <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search matrix..." 
                className="pl-9 bg-white border-slate-200 h-9 text-sm" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <div className="flex gap-6 items-center bg-slate-100/50 px-4 py-1.5 rounded-lg border border-slate-200">
               <div className="text-right">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">{t('matrix.company')}</p>
                  <p className="text-[11px] font-bold text-slate-700">{localItems[0]?.companyName || "N/A"}</p>
               </div>
               <div className="w-px h-6 bg-slate-300" />
               <div className="text-right">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">{t('matrix.location')}</p>
                  <p className="text-[11px] font-bold text-slate-700">{localItems[0]?.locationCode || "N/A"}</p>
               </div>
            </div>
          </div>
        </div>

        {/* Matrix Area - Scrollable */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="h-full w-full border rounded-xl bg-white shadow-2xl overflow-auto border-slate-200 relative">
            <Table className="min-w-[4800px] table-fixed border-separate border-spacing-0">
              <TableHeader className="sticky top-0 z-50">
                <TableRow className="divide-x divide-slate-200 bg-slate-100">
                  {/* Fixed Columns Header */}
                  <TableHead className="w-[60px] font-black uppercase text-[10px] text-center sticky left-0 z-[60] bg-slate-100 border-r-2 border-slate-300">i. No</TableHead>
                  <TableHead className="w-[280px] font-black uppercase text-[10px] sticky left-[60px] z-[60] bg-slate-100 border-r-2 border-slate-300 text-indigo-700">ii. {t('matrix.process_info')}</TableHead>
                  <TableHead className="w-[220px] font-black uppercase text-[10px] sticky left-[340px] z-[60] bg-slate-100 border-r-2 border-slate-300">iii. {t('matrix.sub_process')}</TableHead>
                  
                  {/* Floating Columns Header */}
                  <TableHead className="w-[200px] font-black uppercase text-[10px] bg-slate-100">iv. {t('matrix.company')}</TableHead>
                  <TableHead className="w-[100px] font-black uppercase text-[10px] bg-slate-100 text-center">v. {t('matrix.location')}</TableHead>
                  <TableHead className="w-[400px] font-black uppercase text-[10px] bg-slate-100">vi. {t('matrix.risk_description')}</TableHead>
                  <TableHead className="w-[80px] text-center font-black uppercase text-[10px] bg-slate-100">vii. Fraud</TableHead>
                  <TableHead className="w-[120px] text-center font-black uppercase text-[10px] bg-slate-100">viii. {t('matrix.risk_rating')}</TableHead>
                  <TableHead className="w-[140px] font-black uppercase text-[10px] bg-slate-100">ix. {t('matrix.control_ref')}</TableHead>
                  <TableHead className="w-[350px] font-black uppercase text-[10px] bg-slate-100">x. {t('matrix.control_name')}</TableHead>
                  <TableHead className="w-[500px] font-black uppercase text-[10px] bg-slate-100">xi. {t('matrix.control_description')}</TableHead>
                  <TableHead className="w-[250px] font-black uppercase text-[10px] bg-slate-100">xii. {t('matrix.supporting_docs')}</TableHead>
                  <TableHead className="w-[100px] text-center font-black uppercase text-[10px] bg-slate-100">xiii. Utama?</TableHead>
                  
                  {/* Group Headers with Solid Opaque Colors */}
                  <TableHead className="w-[240px] bg-blue-700 text-white font-black uppercase text-[10px] text-center border-l-4 border-blue-800" colSpan={4}>Information Processing Objective (xiv-xvii)</TableHead>
                  <TableHead className="w-[420px] bg-indigo-700 text-white font-black uppercase text-[10px] text-center border-l-4 border-indigo-800" colSpan={7}>{t('matrix.assertions')} (xviii-xxiv)</TableHead>
                  
                  <TableHead className="w-[180px] font-black uppercase text-[10px] bg-slate-100">xxv. {t('matrix.type')}</TableHead>
                  <TableHead className="w-[200px] font-black uppercase text-[10px] bg-slate-100">xxvi. {t('matrix.nature')}</TableHead>
                  <TableHead className="w-[220px] font-black uppercase text-[10px] bg-slate-100">xxvii. {t('matrix.automated_type')}</TableHead>
                  <TableHead className="w-[150px] font-black uppercase text-[10px] bg-slate-100 text-center">xxviii. {t('matrix.frequency')}</TableHead>
                  <TableHead className="w-[200px] font-black uppercase text-[10px] bg-slate-100">xxix. {t('matrix.supporting_app')}</TableHead>
                  <TableHead className="w-[200px] font-black uppercase text-[10px] bg-slate-100">xxx. {t('matrix.executing_function')}</TableHead>
                  <TableHead className="w-[200px] font-black uppercase text-[10px] bg-slate-100">xxxi. {t('matrix.executor_role')}</TableHead>
                  <TableHead className="w-[250px] font-black uppercase text-[10px] bg-slate-100">xxxii. {t('matrix.affected_fsli_item')}</TableHead>
                  <TableHead className="w-[150px] font-black uppercase text-[10px] bg-slate-100 text-center">xxxiii. {t('matrix.effective_period')}</TableHead>
                </TableRow>
                
                {/* Sub-Header Row */}
                <TableRow className="divide-x divide-slate-200 text-[9px] bg-slate-50">
                   <TableHead className="sticky left-0 z-[60] bg-slate-50 border-r-2 border-slate-300"></TableHead>
                   <TableHead className="sticky left-[60px] z-[60] bg-slate-50 border-r-2 border-slate-300"></TableHead>
                   <TableHead className="sticky left-[340px] z-[60] bg-slate-50 border-r-2 border-slate-300"></TableHead>
                   <TableHead colSpan={10} className="bg-slate-50/30"></TableHead>
                   
                   <TableHead className="text-center bg-blue-600 text-white border-l-4 border-blue-800 font-bold">C (xiv)</TableHead>
                   <TableHead className="text-center bg-blue-600 text-white font-bold">A (xv)</TableHead>
                   <TableHead className="text-center bg-blue-600 text-white font-bold">V (xvi)</TableHead>
                   <TableHead className="text-center bg-blue-600 text-white font-bold">RA (xvii)</TableHead>

                   <TableHead className="text-center bg-indigo-600 text-white border-l-4 border-indigo-800 font-bold">E/O (xviii)</TableHead>
                   <TableHead className="text-center bg-indigo-600 text-white font-bold">C (xix)</TableHead>
                   <TableHead className="text-center bg-indigo-600 text-white font-bold">A (xx)</TableHead>
                   <TableHead className="text-center bg-indigo-600 text-white font-bold">CO (xxi)</TableHead>
                   <TableHead className="text-center bg-indigo-600 text-white font-bold">R&O (xxii)</TableHead>
                   <TableHead className="text-center bg-indigo-600 text-white font-bold">V/A (xxiii)</TableHead>
                   <TableHead className="text-center bg-indigo-600 text-white font-bold">PD (xxiv)</TableHead>
                   <TableHead colSpan={9} className="bg-slate-50/30"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={33} className="h-64 text-center">Loading matrix data...</TableCell></TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow><TableCell colSpan={33} className="h-64 text-center italic text-slate-400">No RCM relationships found.</TableCell></TableRow>
                ) : filteredItems.map((item, idx) => {
                  const isFirstOfProcess = idx === 0 || item.noGL !== filteredItems[idx-1].noGL;
                  const isFirstOfSub = idx === 0 || item.subProcessName !== filteredItems[idx-1].subProcessName;
                  const isFirstOfRisk = idx === 0 || item.riskDescription !== filteredItems[idx-1].riskDescription;

                  return (
                    <TableRow key={`${item.mappingId}-${idx}`} className="group hover:bg-indigo-50/5 transition-colors divide-x divide-slate-100">
                      <TableCell className="text-center text-[10px] font-black text-slate-400 sticky left-0 z-30 bg-white border-r-2 border-slate-200">
                         {idx + 1}
                      </TableCell>
                      <TableCell className={cn("align-top font-bold text-slate-800 text-[11px] sticky left-[60px] z-30 bg-white border-r-2 border-slate-200", !isFirstOfProcess && "text-transparent border-none")}>
                        <div className="flex flex-col gap-0.5 pr-2">
                          <span className="uppercase tracking-tighter text-indigo-600 text-[9px] font-black">{item.fsliName}</span>
                          <span className="line-clamp-2 leading-tight">{item.noGL} - {item.processName}</span>
                        </div>
                      </TableCell>
                      <TableCell className={cn("align-top font-bold text-slate-600 text-[11px] sticky left-[340px] z-30 bg-white border-r-2 border-slate-200", !isFirstOfSub && "text-transparent border-none")}>
                        {item.subProcessName}
                      </TableCell>
                      
                      <TableCell className="align-top text-xs text-slate-600 px-3 pt-4">{item.companyName}</TableCell>
                      <TableCell className="align-top text-xs text-slate-600 font-mono px-3 pt-4 text-center bg-slate-50/30">{item.locationCode}</TableCell>
                      
                      <TableCell className={cn("align-top text-[11px] text-slate-700 px-3 pt-4 leading-relaxed", !isFirstOfRisk && "opacity-30")}>
                        {item.riskDescription}
                      </TableCell>
                      <TableCell className="text-center align-top pt-4 bg-slate-50/30">
                        {item.isFraudRelated && <AlertTriangle className="h-3.5 w-3.5 text-rose-500 mx-auto" />}
                      </TableCell>
                      <TableCell className="text-center align-top pt-4">
                        <Badge className={cn("text-[9px] font-black px-2", 
                          item.riskRating === 'High' ? "bg-rose-100 text-rose-700" : 
                          item.riskRating === 'Medium' ? "bg-amber-100 text-amber-700" : 
                          "bg-emerald-100 text-emerald-700"
                        )}>{item.riskRating}</Badge>
                      </TableCell>

                      <TableCell className="align-top font-mono text-[10px] pt-4 font-bold text-indigo-700 px-3 bg-slate-50/30">
                        {item.controlCode}
                      </TableCell>
                      <TableCell className="p-0">
                         <Input 
                           className="h-full border-none focus-visible:ring-0 text-[11px] px-3 font-bold text-slate-800" 
                           value={item.mappedControlName || item.baseControlName || ''} 
                           onChange={e => handleInputChange(item.mappingId, 'mappedControlName', e.target.value)} 
                         />
                      </TableCell>
                      <TableCell className="p-0">
                         <Input 
                           className="h-full border-none focus-visible:ring-0 text-[11px] px-3 text-slate-600 italic" 
                           value={item.mappedControlDescription || item.baseControlDescription || ''} 
                           onChange={e => handleInputChange(item.mappingId, 'mappedControlDescription', e.target.value)} 
                         />
                      </TableCell>

                      <TableCell className="p-0 bg-slate-50/30">
                         <Input className="h-full border-none focus-visible:ring-0 text-[11px] px-3" value={item.supportingDocs || ''} onChange={e => handleInputChange(item.mappingId, 'supportingDocs', e.target.value)} placeholder="Link..." />
                      </TableCell>
                      <TableCell className="text-center align-top pt-4 px-3">
                         <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 cursor-pointer" checked={item.isKeyControl} onChange={e => handleInputChange(item.mappingId, 'isKeyControl', e.target.checked)} />
                      </TableCell>

                      {/* IPO Inputs with Solid Contrast */}
                      <TableCell className="p-0 border-l-4 border-blue-300">
                         <Input className="h-full border-none focus-visible:ring-0 text-center text-[11px] uppercase font-black bg-blue-50/30 text-blue-900" value={item.ipoC || ''} onChange={e => handleInputChange(item.mappingId, 'ipoC', e.target.value)} maxLength={1} />
                      </TableCell>
                      <TableCell className="p-0">
                         <Input className="h-full border-none focus-visible:ring-0 text-center text-[11px] uppercase font-black bg-blue-50/30 text-blue-900" value={item.ipoA || ''} onChange={e => handleInputChange(item.mappingId, 'ipoA', e.target.value)} maxLength={1} />
                      </TableCell>
                      <TableCell className="p-0">
                         <Input className="h-full border-none focus-visible:ring-0 text-center text-[11px] uppercase font-black bg-blue-50/30 text-blue-900" value={item.ipoV || ''} onChange={e => handleInputChange(item.mappingId, 'ipoV', e.target.value)} maxLength={1} />
                      </TableCell>
                      <TableCell className="p-0">
                         <Input className="h-full border-none focus-visible:ring-0 text-center text-[11px] uppercase font-black bg-blue-50/30 text-blue-900" value={item.ipoRa || ''} onChange={e => handleInputChange(item.mappingId, 'ipoRa', e.target.value)} maxLength={1} />
                      </TableCell>

                      {/* Assertion Inputs with Solid Contrast */}
                      <TableCell className="p-0 border-l-4 border-indigo-300">
                         <Input className="h-full border-none focus-visible:ring-0 text-center text-[11px] uppercase font-black bg-indigo-50/30 text-indigo-900" value={item.assertionE || ''} onChange={e => handleInputChange(item.mappingId, 'assertionE', e.target.value)} maxLength={1} />
                      </TableCell>
                      <TableCell className="p-0">
                         <Input className="h-full border-none focus-visible:ring-0 text-center text-[11px] uppercase font-black bg-indigo-50/30 text-indigo-900" value={item.assertionC || ''} onChange={e => handleInputChange(item.mappingId, 'assertionC', e.target.value)} maxLength={1} />
                      </TableCell>
                      <TableCell className="p-0">
                         <Input className="h-full border-none focus-visible:ring-0 text-center text-[11px] uppercase font-black bg-indigo-50/30 text-indigo-900" value={item.assertionA || ''} onChange={e => handleInputChange(item.mappingId, 'assertionA', e.target.value)} maxLength={1} />
                      </TableCell>
                      <TableCell className="p-0">
                         <Input className="h-full border-none focus-visible:ring-0 text-center text-[11px] uppercase font-black bg-indigo-50/30 text-indigo-900" value={item.assertionCo || ''} onChange={e => handleInputChange(item.mappingId, 'assertionCo', e.target.value)} maxLength={1} />
                      </TableCell>
                      <TableCell className="p-0">
                         <Input className="h-full border-none focus-visible:ring-0 text-center text-[11px] uppercase font-black bg-indigo-50/30 text-indigo-900" value={item.assertionRo || ''} onChange={e => handleInputChange(item.mappingId, 'assertionRo', e.target.value)} maxLength={1} />
                      </TableCell>
                      <TableCell className="p-0">
                         <Input className="h-full border-none focus-visible:ring-0 text-center text-[11px] uppercase font-black bg-indigo-50/30 text-indigo-900" value={item.assertionVa || ''} onChange={e => handleInputChange(item.mappingId, 'assertionVa', e.target.value)} maxLength={1} />
                      </TableCell>
                      <TableCell className="p-0">
                         <Input className="h-full border-none focus-visible:ring-0 text-center text-[11px] uppercase font-black bg-indigo-50/30 text-indigo-900" value={item.assertionPd || ''} onChange={e => handleInputChange(item.mappingId, 'assertionPd', e.target.value)} maxLength={1} />
                      </TableCell>

                      {/* Technical Selects */}
                      <TableCell className="p-0">
                         <Select value={item.controlType || ''} onValueChange={val => handleInputChange(item.mappingId, 'controlType', val)}>
                           <SelectTrigger className="h-full border-none rounded-none focus:ring-0 text-xs shadow-none px-3"><SelectValue placeholder="..." /></SelectTrigger>
                           <SelectContent><SelectItem value="Preventif">Preventif</SelectItem><SelectItem value="Detektif">Detektif</SelectItem></SelectContent>
                         </Select>
                      </TableCell>
                      <TableCell className="p-0">
                         <Select value={item.controlNature || ''} onValueChange={val => handleInputChange(item.mappingId, 'controlNature', val)}>
                           <SelectTrigger className="h-full border-none rounded-none focus:ring-0 text-xs shadow-none px-3"><SelectValue placeholder="..." /></SelectTrigger>
                           <SelectContent>
                              <SelectItem value="Manual">Manual</SelectItem>
                              <SelectItem value="Otomatis">Otomatis</SelectItem>
                              <SelectItem value="ITDM - EUC">ITDM - EUC</SelectItem>
                              <SelectItem value="ITDM - IPE">ITDM - IPE</SelectItem>
                              <SelectItem value="MRC">MRC</SelectItem>
                           </SelectContent>
                         </Select>
                      </TableCell>
                      <TableCell className="p-0 bg-slate-50/30">
                         <Select value={item.automatedType || ''} onValueChange={val => handleInputChange(item.mappingId, 'automatedType', val)} disabled={item.controlNature !== 'Otomatis' && !item.controlNature?.includes('ITDM')}>
                           <SelectTrigger className="h-full border-none rounded-none focus:ring-0 text-xs shadow-none px-3"><SelectValue placeholder="..." /></SelectTrigger>
                           <SelectContent>
                              <SelectItem value="Automated Control">Automated Control</SelectItem>
                              <SelectItem value="Automated Calculation">Automated Calculation</SelectItem>
                              <SelectItem value="Restricted Access">Restricted Access</SelectItem>
                              <SelectItem value="Interface">Interface</SelectItem>
                           </SelectContent>
                         </Select>
                      </TableCell>
                      <TableCell className="p-0">
                         <Input className="h-full border-none focus-visible:ring-0 text-xs px-3" value={item.frequency || ''} onChange={e => handleInputChange(item.mappingId, 'frequency', e.target.value)} placeholder="..." />
                      </TableCell>
                      <TableCell className="p-0 bg-slate-50/30">
                         <Input className="h-full border-none focus-visible:ring-0 text-xs px-3" value={item.supportingApp || ''} onChange={e => handleInputChange(item.mappingId, 'supportingApp', e.target.value)} placeholder="..." />
                      </TableCell>
                      <TableCell className="p-0">
                         <Input className="h-full border-none focus-visible:ring-0 text-xs px-3" value={item.executingFunction || ''} onChange={e => handleInputChange(item.mappingId, 'executingFunction', e.target.value)} placeholder="..." />
                      </TableCell>
                      <TableCell className="p-0 bg-slate-50/30">
                         <Input className="h-full border-none focus-visible:ring-0 text-xs px-3" value={item.executorRole || ''} onChange={e => handleInputChange(item.mappingId, 'executorRole', e.target.value)} placeholder="..." />
                      </TableCell>
                      <TableCell className="p-0">
                         <Input className="h-full border-none focus-visible:ring-0 text-xs px-3 font-mono" value={item.affectedFsliItem || ''} onChange={e => handleInputChange(item.mappingId, 'affectedFsliItem', e.target.value)} />
                      </TableCell>
                      <TableCell className="p-0 bg-slate-50/30">
                         <Input className="h-full border-none focus-visible:ring-0 text-xs px-3 text-center" value={item.effectivePeriod || ''} onChange={e => handleInputChange(item.mappingId, 'effectivePeriod', e.target.value)} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      <UnsavedChangesDialog blocker={blocker} />
    </AppLayout>
  );
}
