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
  Search, FileDown, Save, Loader2, Info, ChevronRight, AlertTriangle, 
  ShieldCheck, Database, Filter
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

  // Calculate isDirty state
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
      controlName: item.controlName,
      controlDescription: item.controlDescription,
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
    item.controlName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout container>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('matrix.title_tlc')}</h1>
            <p className="text-muted-foreground italic text-sm">Regulatory Hierarchical Matrix according to SK-5/DKU.MBU/11/2024.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['rcm-matrix-tlc'] })}>
              <Filter className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg">
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {t('common:actions.save')}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 bg-slate-100/50 p-4 rounded-lg border border-slate-200">
           <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-9 bg-white" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="flex gap-4">
             <div className="text-right border-r pr-4 border-slate-300">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('matrix.company')}</p>
                <p className="text-xs font-bold text-slate-600">{localItems[0]?.companyName || "N/A"}</p>
             </div>
             <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('matrix.location')}</p>
                <p className="text-xs font-bold text-slate-600">{localItems[0]?.locationCode || "N/A"}</p>
             </div>
          </div>
        </div>

        <div className="border rounded-xl bg-white shadow-sm overflow-x-auto relative">
          <Table className="min-w-[4500px]">
            <TableHeader className="bg-slate-50/80 sticky top-0 z-20">
              <TableRow className="divide-x border-b">
                {/* i - v */}
                <TableHead className="w-[60px] font-black uppercase text-[10px] text-center sticky left-0 z-30 bg-slate-50">i. No</TableHead>
                <TableHead className="w-[250px] font-black uppercase text-[10px] sticky left-[60px] z-30 bg-slate-50">ii. {t('matrix.process_info')}</TableHead>
                <TableHead className="w-[200px] font-black uppercase text-[10px] sticky left-[310px] z-30 bg-slate-50">iii. {t('matrix.sub_process')}</TableHead>
                <TableHead className="w-[200px] font-black uppercase text-[10px]">iv. {t('matrix.company')}</TableHead>
                <TableHead className="w-[100px] font-black uppercase text-[10px]">v. {t('matrix.location')}</TableHead>
                
                {/* vi - viii */}
                <TableHead className="w-[300px] font-black uppercase text-[10px]">vi. {t('matrix.risk_description')}</TableHead>
                <TableHead className="w-[80px] text-center font-black uppercase text-[10px]">vii. Fraud</TableHead>
                <TableHead className="w-[100px] text-center font-black uppercase text-[10px]">viii. {t('matrix.risk_rating')}</TableHead>
                
                {/* ix - xi */}
                <TableHead className="w-[120px] font-black uppercase text-[10px]">ix. Ref Kontrol</TableHead>
                <TableHead className="w-[300px] font-black uppercase text-[10px]">x. {t('matrix.control_name')}</TableHead>
                <TableHead className="w-[400px] font-black uppercase text-[10px]">xi. {t('matrix.control_description')}</TableHead>
                
                {/* xii - xiii */}
                <TableHead className="w-[200px] font-black uppercase text-[10px]">xii. {t('matrix.supporting_docs')}</TableHead>
                <TableHead className="w-[100px] text-center font-black uppercase text-[10px]">xiii. Utama?</TableHead>
                
                {/* xiv - xvii (IPO) */}
                <TableHead className="w-[200px] bg-blue-50/50 text-blue-900 font-black uppercase text-[10px] text-center border-l-4 border-blue-200" colSpan={4}>Information Processing Objective (xiv-xvii)</TableHead>
                
                {/* xviii - xxiv (Assertions) */}
                <TableHead className="w-[350px] bg-indigo-50/50 text-indigo-900 font-black uppercase text-[10px] text-center border-l-4 border-indigo-200" colSpan={7}>Asersi Laporan Keuangan (xviii-xxiv)</TableHead>
                
                {/* xxv - xxxiii (Technical) */}
                <TableHead className="w-[150px] font-black uppercase text-[10px]">xxv. {t('matrix.type')}</TableHead>
                <TableHead className="w-[200px] font-black uppercase text-[10px]">xxvi. {t('matrix.nature')}</TableHead>
                <TableHead className="w-[200px] font-black uppercase text-[10px]">xxvii. {t('matrix.automated_type')}</TableHead>
                <TableHead className="w-[150px] font-black uppercase text-[10px]">xxviii. {t('matrix.frequency')}</TableHead>
                <TableHead className="w-[200px] font-black uppercase text-[10px]">xxix. {t('matrix.supporting_app')}</TableHead>
                <TableHead className="w-[200px] font-black uppercase text-[10px]">xxx. {t('matrix.executing_function')}</TableHead>
                <TableHead className="w-[200px] font-black uppercase text-[10px]">xxxi. {t('matrix.executor_role')}</TableHead>
                <TableHead className="w-[250px] font-black uppercase text-[10px]">xxxii. {t('matrix.affected_fsli_item')}</TableHead>
                <TableHead className="w-[150px] font-black uppercase text-[10px]">xxxiii. {t('matrix.effective_period')}</TableHead>
              </TableRow>
              <TableRow className="divide-x text-[9px] bg-slate-50/30">
                 <TableHead className="sticky left-0 z-30 bg-slate-50"></TableHead>
                 <TableHead className="sticky left-[60px] z-30 bg-slate-50"></TableHead>
                 <TableHead className="sticky left-[310px] z-30 bg-slate-50"></TableHead>
                 <TableHead></TableHead><TableHead></TableHead><TableHead></TableHead><TableHead></TableHead><TableHead></TableHead><TableHead></TableHead><TableHead></TableHead><TableHead></TableHead><TableHead></TableHead><TableHead></TableHead>
                 
                 {/* IPO Subheads */}
                 <TableHead className="text-center bg-blue-50/20 border-l-4 border-blue-200">C (xiv)</TableHead>
                 <TableHead className="text-center bg-blue-50/20">A (xv)</TableHead>
                 <TableHead className="text-center bg-blue-50/20">V (xvi)</TableHead>
                 <TableHead className="text-center bg-blue-50/20">RA (xvii)</TableHead>

                 {/* Assertion Subheads */}
                 <TableHead className="text-center bg-indigo-50/20 border-l-4 border-indigo-200">E/O (xviii)</TableHead>
                 <TableHead className="text-center bg-indigo-50/20">C (xix)</TableHead>
                 <TableHead className="text-center bg-indigo-50/20">A (xx)</TableHead>
                 <TableHead className="text-center bg-indigo-50/20">CO (xxi)</TableHead>
                 <TableHead className="text-center bg-indigo-50/20">R&O (xxii)</TableHead>
                 <TableHead className="text-center bg-indigo-50/20">V/A (xxiii)</TableHead>
                 <TableHead className="text-center bg-indigo-50/20">PD (xxiv)</TableHead>
                 
                 <TableHead></TableHead><TableHead></TableHead><TableHead></TableHead><TableHead></TableHead><TableHead></TableHead><TableHead></TableHead><TableHead></TableHead><TableHead></TableHead><TableHead></TableHead>
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
                  <TableRow key={item.mappingId} className="group hover:bg-slate-50 transition-colors divide-x divide-slate-100">
                    <TableCell className="text-center text-[10px] font-bold text-slate-400 sticky left-0 z-10 bg-white">
                       {idx + 1}
                    </TableCell>
                    <TableCell className={cn("align-top font-bold text-slate-800 text-xs sticky left-[60px] z-10 bg-white", !isFirstOfProcess && "text-transparent border-none")}>
                      <div className="flex flex-col gap-0.5">
                        <span className="uppercase tracking-tighter text-indigo-600 text-[10px]">{item.fsliName}</span>
                        <span>{item.noGL} - {item.processName}</span>
                      </div>
                    </TableCell>
                    <TableCell className={cn("align-top font-medium text-slate-600 text-xs sticky left-[310px] z-10 bg-white", !isFirstOfSub && "text-transparent border-none")}>
                      {item.subProcessName}
                    </TableCell>
                    <TableCell className="align-top text-xs text-slate-600">{item.companyName}</TableCell>
                    <TableCell className="align-top text-xs text-slate-600 font-mono">{item.locationCode}</TableCell>
                    
                    <TableCell className={cn("align-top text-xs text-slate-700", !isFirstOfRisk && "opacity-30")}>
                      {item.riskDescription}
                    </TableCell>
                    <TableCell className="text-center align-top pt-4">
                      {item.isFraudRelated && <AlertTriangle className="h-3.5 w-3.5 text-rose-500 mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center align-top pt-4">
                      <Badge className={cn("text-[9px] font-black", 
                        item.riskRating === 'High' ? "bg-rose-100 text-rose-700" : 
                        item.riskRating === 'Medium' ? "bg-amber-100 text-amber-700" : 
                        "bg-emerald-100 text-emerald-700"
                      )}>{item.riskRating}</Badge>
                    </TableCell>

                    <TableCell className="align-top font-mono text-[10px] pt-4 font-bold text-indigo-700">
                      {item.controlCode}
                    </TableCell>
                    <TableCell className="p-0">
                       <Input 
                         className="h-full border-none focus-visible:ring-0 text-xs px-2 font-bold" 
                         value={item.mappedControlName || item.baseControlName || ''} 
                         onChange={e => handleInputChange(item.mappingId, 'mappedControlName', e.target.value)} 
                       />
                    </TableCell>
                    <TableCell className="p-0">
                       <Input 
                         className="h-full border-none focus-visible:ring-0 text-xs px-2" 
                         value={item.mappedControlDescription || item.baseControlDescription || ''} 
                         onChange={e => handleInputChange(item.mappingId, 'mappedControlDescription', e.target.value)} 
                       />
                    </TableCell>

                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-xs px-2" value={item.supportingDocs || ''} onChange={e => handleInputChange(item.mappingId, 'supportingDocs', e.target.value)} placeholder="Link..." />
                    </TableCell>
                    <TableCell className="text-center align-top pt-4">
                       <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600" checked={item.isKeyControl} onChange={e => handleInputChange(item.mappingId, 'isKeyControl', e.target.checked)} />
                    </TableCell>

                    {/* IPO xiv-xvii */}
                    <TableCell className="p-0 border-l-4 border-blue-200">
                       <Input className="h-full border-none focus-visible:ring-0 text-center text-[10px] uppercase font-bold" value={item.ipoC || ''} onChange={e => handleInputChange(item.mappingId, 'ipoC', e.target.value)} maxLength={1} />
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-center text-[10px] uppercase font-bold" value={item.ipoA || ''} onChange={e => handleInputChange(item.mappingId, 'ipoA', e.target.value)} maxLength={1} />
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-center text-[10px] uppercase font-bold" value={item.ipoV || ''} onChange={e => handleInputChange(item.mappingId, 'ipoV', e.target.value)} maxLength={1} />
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-center text-[10px] uppercase font-bold" value={item.ipoRa || ''} onChange={e => handleInputChange(item.mappingId, 'ipoRa', e.target.value)} maxLength={1} />
                    </TableCell>

                    {/* Assertion xviii-xxiv */}
                    <TableCell className="p-0 border-l-4 border-indigo-200">
                       <Input className="h-full border-none focus-visible:ring-0 text-center text-[10px] uppercase font-bold" value={item.assertionE || ''} onChange={e => handleInputChange(item.mappingId, 'assertionE', e.target.value)} maxLength={1} />
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-center text-[10px] uppercase font-bold" value={item.assertionC || ''} onChange={e => handleInputChange(item.mappingId, 'assertionC', e.target.value)} maxLength={1} />
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-center text-[10px] uppercase font-bold" value={item.assertionA || ''} onChange={e => handleInputChange(item.mappingId, 'assertionA', e.target.value)} maxLength={1} />
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-center text-[10px] uppercase font-bold" value={item.assertionCo || ''} onChange={e => handleInputChange(item.mappingId, 'assertionCo', e.target.value)} maxLength={1} />
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-center text-[10px] uppercase font-bold" value={item.assertionRo || ''} onChange={e => handleInputChange(item.mappingId, 'assertionRo', e.target.value)} maxLength={1} />
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-center text-[10px] uppercase font-bold" value={item.assertionVa || ''} onChange={e => handleInputChange(item.mappingId, 'assertionVa', e.target.value)} maxLength={1} />
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-center text-[10px] uppercase font-bold" value={item.assertionPd || ''} onChange={e => handleInputChange(item.mappingId, 'assertionPd', e.target.value)} maxLength={1} />
                    </TableCell>

                    {/* xxv - xxxiii */}
                    <TableCell className="p-0">
                       <Select value={item.controlType || ''} onValueChange={val => handleInputChange(item.mappingId, 'controlType', val)}>
                         <SelectTrigger className="h-full border-none rounded-none focus:ring-0 text-xs shadow-none"><SelectValue placeholder="..." /></SelectTrigger>
                         <SelectContent><SelectItem value="Preventif">Preventif</SelectItem><SelectItem value="Detektif">Detektif</SelectItem></SelectContent>
                       </Select>
                    </TableCell>
                    <TableCell className="p-0">
                       <Select value={item.controlNature || ''} onValueChange={val => handleInputChange(item.mappingId, 'controlNature', val)}>
                         <SelectTrigger className="h-full border-none rounded-none focus:ring-0 text-xs shadow-none"><SelectValue placeholder="..." /></SelectTrigger>
                         <SelectContent>
                            <SelectItem value="Manual">Manual</SelectItem>
                            <SelectItem value="Otomatis">Otomatis</SelectItem>
                            <SelectItem value="ITDM - EUC">ITDM - EUC</SelectItem>
                            <SelectItem value="ITDM - IPE">ITDM - IPE</SelectItem>
                            <SelectItem value="MRC">MRC</SelectItem>
                         </SelectContent>
                       </Select>
                    </TableCell>
                    <TableCell className="p-0">
                       <Select value={item.automatedType || ''} onValueChange={val => handleInputChange(item.mappingId, 'automatedType', val)} disabled={item.controlNature !== 'Otomatis' && !item.controlNature?.includes('ITDM')}>
                         <SelectTrigger className="h-full border-none rounded-none focus:ring-0 text-xs shadow-none"><SelectValue placeholder="..." /></SelectTrigger>
                         <SelectContent>
                            <SelectItem value="Automated Control">Automated Control</SelectItem>
                            <SelectItem value="Automated Calculation">Automated Calculation</SelectItem>
                            <SelectItem value="Restricted Access">Restricted Access</SelectItem>
                            <SelectItem value="Interface">Interface</SelectItem>
                         </SelectContent>
                       </Select>
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-xs px-2" value={item.frequency || ''} onChange={e => handleInputChange(item.mappingId, 'frequency', e.target.value)} placeholder="Bulanan..." />
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-xs px-2" value={item.supportingApp || ''} onChange={e => handleInputChange(item.mappingId, 'supportingApp', e.target.value)} placeholder="misal: SAP" />
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-xs px-2" value={item.executingFunction || ''} onChange={e => handleInputChange(item.mappingId, 'executingFunction', e.target.value)} placeholder="Fungsi..." />
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-xs px-2" value={item.executorRole || ''} onChange={e => handleInputChange(item.mappingId, 'executorRole', e.target.value)} placeholder="Jabatan..." />
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-xs px-2 font-mono" value={item.affectedFsliItem || ''} onChange={e => handleInputChange(item.mappingId, 'affectedFsliItem', e.target.value)} />
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-xs px-2" value={item.effectivePeriod || ''} onChange={e => handleInputChange(item.mappingId, 'effectivePeriod', e.target.value)} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      <UnsavedChangesDialog blocker={blocker} />
    </AppLayout>
  );
}
