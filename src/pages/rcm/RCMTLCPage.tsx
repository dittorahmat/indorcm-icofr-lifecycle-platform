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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

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
  controlName: string;
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

  const saveMutation = useMutation({
    mutationFn: (items: Partial<RCMMatrixItem>[]) => 
      api('/api/rcm-matrix/tlc/batch-update', { 
        method: 'POST', 
        body: JSON.stringify({ items }) 
      }),
    onSuccess: () => {
      toast.success('Matrix data saved successfully');
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
      frequency: item.frequency,
      isKeyControl: item.isKeyControl,
      supportingDocs: item.supportingDocs,
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
            <h1 className="text-3xl font-bold tracking-tight">RCM TLC Matrix</h1>
            <p className="text-muted-foreground italic text-sm">Regulatory Hierarchical Matrix according to SK-5/DKU.MBU/11/2024.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['rcm-matrix-tlc'] })}>
              <Filter className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg">
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 bg-slate-100/50 p-4 rounded-lg border border-slate-200">
           <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by process, risk, or control..." 
              className="pl-9 bg-white" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="flex gap-4">
             <div className="text-right border-r pr-4 border-slate-300">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Company</p>
                <p className="text-xs font-bold text-slate-600">{localItems[0]?.companyName || "PT Batubara Nusantara"}</p>
             </div>
             <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Location</p>
                <p className="text-xs font-bold text-slate-600">{localItems[0]?.locationCode || "0101"}</p>
             </div>
          </div>
        </div>

        <div className="border rounded-xl bg-white shadow-sm overflow-x-auto relative">
          <Table className="min-w-[2800px]">
            <TableHeader className="bg-slate-50/80 sticky top-0 z-20">
              <TableRow className="divide-x border-b">
                <TableHead className="w-[250px] font-black uppercase text-[10px] sticky left-0 z-30 bg-slate-50">{t('matrix.process_info')}</TableHead>
                <TableHead className="w-[200px] font-black uppercase text-[10px] sticky left-[250px] z-30 bg-slate-50">{t('matrix.sub_process')}</TableHead>
                <TableHead className="w-[200px] font-black uppercase text-[10px]">{t('matrix.company') || 'Perusahaan Pelaksana'}</TableHead>
                <TableHead className="w-[100px] font-black uppercase text-[10px]">{t('matrix.location') || 'Lokasi'}</TableHead>
                <TableHead className="w-[300px] font-black uppercase text-[10px]">{t('matrix.risk_description')}</TableHead>
                <TableHead className="w-[80px] text-center font-black uppercase text-[10px]">{t('matrix.fraud_related')}</TableHead>
                <TableHead className="w-[100px] text-center font-black uppercase text-[10px]">{t('matrix.risk_rating')}</TableHead>
                <TableHead className="w-[120px] font-black uppercase text-[10px]">{t('matrix.control_ref')}</TableHead>
                <TableHead className="w-[300px] font-black uppercase text-[10px]">{t('matrix.control_name')}</TableHead>
                
                {/* Column Group: IPO */}
                <TableHead className="w-[200px] bg-blue-50/50 text-blue-900 font-black uppercase text-[10px] text-center border-l-4 border-blue-200" colSpan={4}>{t('matrix.ipo')}</TableHead>
                
                {/* Column Group: Assertions */}
                <TableHead className="w-[350px] bg-indigo-50/50 text-indigo-900 font-black uppercase text-[10px] text-center border-l-4 border-indigo-200" colSpan={7}>{t('matrix.assertions')}</TableHead>
                
                <TableHead className="w-[150px] font-black uppercase text-[10px]">{t('matrix.type')}</TableHead>
                <TableHead className="w-[150px] font-black uppercase text-[10px]">{t('matrix.nature')}</TableHead>
                <TableHead className="w-[120px] font-black uppercase text-[10px]">{t('matrix.frequency')}</TableHead>
                <TableHead className="w-[200px] font-black uppercase text-[10px]">{t('matrix.supporting_docs')}</TableHead>
                <TableHead className="w-[100px] text-center font-black uppercase text-[10px]">{t('matrix.key_control')}</TableHead>
              </TableRow>
              <TableRow className="divide-x text-[9px] bg-slate-50/30">
                 <TableHead className="sticky left-0 z-30 bg-slate-50"></TableHead>
                 <TableHead className="sticky left-[250px] z-30 bg-slate-50"></TableHead>
                 <TableHead></TableHead>
                 <TableHead></TableHead>
                 <TableHead></TableHead>
                 <TableHead></TableHead>
                 <TableHead></TableHead>
                 <TableHead></TableHead>
                 <TableHead></TableHead>
                 
                 {/* IPO Subheads */}
                 <TableHead className="text-center bg-blue-50/20 border-l-4 border-blue-200">C</TableHead>
                 <TableHead className="text-center bg-blue-50/20">A</TableHead>
                 <TableHead className="text-center bg-blue-50/20">V</TableHead>
                 <TableHead className="text-center bg-blue-50/20">RA</TableHead>

                 {/* Assertion Subheads */}
                 <TableHead className="text-center bg-indigo-50/20 border-l-4 border-indigo-200">E</TableHead>
                 <TableHead className="text-center bg-indigo-50/20">C</TableHead>
                 <TableHead className="text-center bg-indigo-50/20">A</TableHead>
                 <TableHead className="text-center bg-indigo-50/20">CO</TableHead>
                 <TableHead className="text-center bg-indigo-50/20">VA</TableHead>
                 <TableHead className="text-center bg-indigo-50/20">RO</TableHead>
                 <TableHead className="text-center bg-indigo-50/20">PD</TableHead>
                 
                 <TableHead></TableHead>
                 <TableHead></TableHead>
                 <TableHead></TableHead>
                 <TableHead></TableHead>
                 <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={25} className="h-64 text-center">Loading matrix data...</TableCell></TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow><TableCell colSpan={25} className="h-64 text-center italic text-slate-400">No RCM relationships found. Please link Risks to Controls in the BPM Editor first.</TableCell></TableRow>
              ) : filteredItems.map((item, idx) => {
                // Hierarchical display logic: only show process/risk if it changed from previous row
                const isFirstOfProcess = idx === 0 || item.noGL !== filteredItems[idx-1].noGL;
                const isFirstOfSub = idx === 0 || item.subProcessName !== filteredItems[idx-1].subProcessName;
                const isFirstOfRisk = idx === 0 || item.riskDescription !== filteredItems[idx-1].riskDescription;

                return (
                  <TableRow key={item.mappingId} className="group hover:bg-slate-50 transition-colors divide-x divide-slate-100">
                    <TableCell className={cn("align-top font-bold text-slate-800 text-xs sticky left-0 z-10 bg-white", !isFirstOfProcess && "text-transparent border-none")}>
                      <div className="flex flex-col gap-0.5">
                        <span className="uppercase tracking-tighter text-indigo-600 text-[10px]">{item.fsliName}</span>
                        <span>{item.noGL} - {item.processName}</span>
                      </div>
                    </TableCell>
                    <TableCell className={cn("align-top font-medium text-slate-600 text-xs sticky left-[250px] z-10 bg-white", !isFirstOfSub && "text-transparent border-none")}>
                      {item.subProcessName}
                    </TableCell>
                    <TableCell className="align-top text-xs text-slate-600">
                      {item.companyName}
                    </TableCell>
                    <TableCell className="align-top text-xs text-slate-600 font-mono">
                      {item.locationCode}
                    </TableCell>
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
                    <TableCell className="align-top text-xs pt-4 font-bold text-slate-800">
                      {item.controlName}
                    </TableCell>

                    {/* IPO Inputs */}
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

                    {/* Assertion Inputs */}
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
                       <Input className="h-full border-none focus-visible:ring-0 text-center text-[10px] uppercase font-bold" value={item.assertionVa || ''} onChange={e => handleInputChange(item.mappingId, 'assertionVa', e.target.value)} maxLength={1} />
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-center text-[10px] uppercase font-bold" value={item.assertionRo || ''} onChange={e => handleInputChange(item.mappingId, 'assertionRo', e.target.value)} maxLength={1} />
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-center text-[10px] uppercase font-bold" value={item.assertionPd || ''} onChange={e => handleInputChange(item.mappingId, 'assertionPd', e.target.value)} maxLength={1} />
                    </TableCell>

                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-xs px-2" value={item.controlType || ''} onChange={e => handleInputChange(item.mappingId, 'controlType', e.target.value)} placeholder="Preventif..." />
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-xs px-2" value={item.controlNature || ''} onChange={e => handleInputChange(item.mappingId, 'controlNature', e.target.value)} placeholder="Manual/Otomatis..." />
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-xs px-2 text-center" value={item.frequency || ''} onChange={e => handleInputChange(item.mappingId, 'frequency', e.target.value)} placeholder="Harian..." />
                    </TableCell>
                    <TableCell className="p-0">
                       <Input className="h-full border-none focus-visible:ring-0 text-xs px-2" value={item.supportingDocs || ''} onChange={e => handleInputChange(item.mappingId, 'supportingDocs', e.target.value)} placeholder="File/Link..." />
                    </TableCell>
                    <TableCell className="text-center align-top pt-4">
                       <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600" checked={item.isKeyControl} onChange={e => handleInputChange(item.mappingId, 'isKeyControl', e.target.checked)} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
