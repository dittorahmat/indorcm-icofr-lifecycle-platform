import React, { useState, useEffect, useMemo } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import ReactFlow, { 
  Background, 
  Controls, 
  NodeProps,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { 
  RefreshCw, ShieldCheck, CheckCircle2, AlertTriangle, 
  X, UserCheck, Activity, Database, FileText, LayoutDashboard,
  Printer, ChevronLeft, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Control, CSARecord, CSATestSample, User, GLRow } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { promptBiometricAuth } from '@/lib/forensic-utils';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// --- Simplified Read-only Nodes ---
const StartEndNode = ({ data }: NodeProps) => (
  <div className={cn(
    "px-6 py-2 shadow-md rounded-[50px] bg-white border-2 min-w-[120px] text-center",
    data.type === 'start' ? "border-green-600" : "border-red-600"
  )}>
    <span className={cn("font-bold text-[11px] uppercase tracking-wider", data.type === 'start' ? "text-green-700" : "text-red-700")}>
      {data.label}
    </span>
  </div>
);

const ActivityNode = ({ data, type }: NodeProps) => (
  <div className={cn(
    "px-4 py-3 shadow-md rounded-sm bg-white border-2 border-slate-800 min-w-[160px] text-center transition-all relative",
    data.highlight && "ring-8 ring-yellow-400 ring-offset-4 rounded-lg animate-pulse scale-110 z-50"
  )}>
    <Handle type="target" position={Position.Top} className="opacity-0" />
    <div className="font-bold text-[9px] mb-1.5 uppercase text-slate-500 border-b pb-1 flex items-center justify-center gap-1">
      {type === 'automated-activity' ? <Database className="h-2.5 w-2.5" /> : <Activity className="h-2.5 w-2.5" />}
      {data.role || (type === 'automated-activity' ? "SYSTEM" : "Role")}
    </div>
    <div className="text-[12px] font-semibold text-slate-800 leading-tight">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="opacity-0" />
  </div>
);

const nodeTypes = {
  start: StartEndNode,
  end: StartEndNode,
  activity: ActivityNode,
  'automated-activity': ActivityNode,
  decision: ({ data }: NodeProps) => (
    <div className="relative flex items-center justify-center w-[80px] h-[80px]">
      <div className="absolute inset-0 border-2 rotate-45 transform shadow-md flex items-center justify-center bg-white border-slate-800">
         <div className="-rotate-45 text-center text-[9px] px-2 font-bold leading-tight uppercase text-slate-700">{data.label}</div>
      </div>
    </div>
  ),
  document: ({ data }: NodeProps) => <div className="px-3 py-2 border-2 border-slate-800 bg-white text-[10px] font-bold uppercase rounded-br-lg flex items-center gap-2"><FileText className="h-3 w-3" /> {data.label}</div>,
  system: ({ data }: NodeProps) => <div className="px-3 py-2 border-2 border-blue-800 bg-blue-50 text-[10px] font-bold uppercase flex flex-col items-center gap-1"><Database className="h-3 w-3" /> {data.label}</div>,
  risk: ({ data }: NodeProps) => <div className="w-10 h-8 bg-red-600 flex items-center justify-center text-white"><AlertTriangle className="h-4 w-4" /></div>,
  control: ({ data }: NodeProps) => <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white"><ShieldCheck className="h-4 w-4" /></div>,
};

// --- Form Validation ---
const csaFormSchema = z.object({
  period: z.string().min(1, "Period is required"),
  result: z.enum(['Effective', 'Ineffective', 'No Transaction']),
  comments: z.string().optional(),
  samplingMethodology: z.string().min(1, "Methodology is required"),
  documentList: z.string().min(1, "Document list is required"),
  isBpmConfirmed: z.boolean().refine(val => val === true, "BPM confirmation is required"),
  samples: z.array(z.object({
    id: z.string().optional(),
    sampleRef: z.string().min(1, "Ref required"),
    glRowId: z.string().optional(),
    controlResults: z.record(z.string(), z.object({
      implemented: z.boolean(),
      evidenceUrl: z.string().optional()
    }))
  })).min(1, "At least one sample is required"),
});

type CSAFormValues = z.infer<typeof csaFormSchema>;

interface CSATabContentProps {
  noGL?: string;
  controls?: Control[];
  initialSamples?: GLRow[];
  bpmProcessId?: string;
  standalone?: boolean;
}

export function CSATabContent({ 
  noGL: propNoGL, 
  controls = [], 
  initialSamples = [],
  bpmProcessId,
  standalone = false 
}: CSATabContentProps) {
  const { t } = useTranslation(['bpm', 'common']);
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  
  const noGL = propNoGL || searchParams.get('noGL') || "";
  const [view, setView] = useState<'list' | 'form'>('list');
  const [activeCsaId, setActiveCsaId] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const form = useForm<CSAFormValues>({
    resolver: zodResolver(csaFormSchema),
    defaultValues: {
      period: '2025-Q1',
      result: 'Effective',
      comments: '',
      samplingMethodology: 'Attribute Sampling / Zero Tolerance Approach',
      documentList: 'Invoice, Evidence of Approval, GL Posting',
      isBpmConfirmed: false,
      samples: []
    }
  });

  const { fields, append, remove, replace: replaceSamples } = useFieldArray({
    control: form.control,
    name: "samples"
  });

  // Track unsaved changes
  const isDirty = form.formState.isDirty && view === 'form' && !activeCsaId;
  useUnsavedChanges(isDirty);

  // Auto-populate samples when initialSamples change
  useEffect(() => {
    if (initialSamples.length > 0 && view !== 'form') {
      const newSamples = initialSamples.map(s => ({
        sampleRef: s.glDesc,
        glRowId: (s as any).id,
        controlResults: controls.reduce((acc, ctrl) => {
          acc[ctrl.id] = { implemented: true };
          return acc;
        }, {} as Record<string, { implemented: boolean }>)
      }));
      replaceSamples(newSamples);
      setView('form'); // Skip gate
    }
  }, [initialSamples, controls, replaceSamples]);

  const { data: diagram } = useQuery({
    queryKey: ['bpm-diagrams', 'by-gl', noGL],
    queryFn: () => api<any>(`/api/bpm-diagrams/by-gl/${noGL}`),
    enabled: !!noGL
  });

  const { data: csaList, isLoading: isListLoading } = useQuery({
    queryKey: ['csa-list', bpmProcessId],
    queryFn: () => api<{ items: CSARecord[] }>(`/api/csa?bpmProcessId=${bpmProcessId}`),
    enabled: !!bpmProcessId && view === 'list'
  });

  const { data: activeCsa } = useQuery({
    queryKey: ['csa-detail', activeCsaId],
    queryFn: () => api<CSARecord>(`/api/csa/${activeCsaId}`),
    enabled: !!activeCsaId
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api('/api/csa', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("CSA Sign-off successful");
      queryClient.invalidateQueries({ queryKey: ['csa-list'] });
      setView('list');
    }
  });

  useEffect(() => {
    if (activeCsa) {
      form.reset({
        period: activeCsa.period,
        result: activeCsa.result,
        comments: activeCsa.comments || '',
        samplingMethodology: (activeCsa as any).samplingMethodology || '',
        documentList: (activeCsa as any).documentList || '',
        isBpmConfirmed: true,
        samples: activeCsa.samples.map(s => ({
          sampleRef: s.sampleRef,
          glRowId: s.glRowId,
          controlResults: s.controlResults || {}
        }))
      });
    }
  }, [activeCsa, form]);

  const onSubmit = async (values: CSAFormValues) => {
    // Validation: Aggregate Zero Tolerance Result Proposal
    const realResult = anySampleFailed ? 'Ineffective' : values.result;
    if (anySampleFailed && values.result === 'Effective') {
       toast.error("Tidak dapat sign-off sebagai Effective karena terdapat kontrol yang gagal.");
       return;
    }

    setIsAuthenticating(true);
    const verified = await promptBiometricAuth('authenticate');
    setIsAuthenticating(false);

    if (!verified) {
      toast.error("Sign-off authentication failed");
      return;
    }

    createMutation.mutate({
      ...values,
      result: realResult,
      bpmProcessId,
      organizationId: (initialSamples[0] as any)?.organizationId || searchParams.get('orgId'),
    });
  };

  const isReadOnly = !!activeCsaId;

  // Hard-Lock logic for "Effective" result
  const anySampleFailed = form.watch('samples').some(s => 
    Object.values(s.controlResults).some(r => !r.implemented)
  );

  useEffect(() => {
    if (anySampleFailed && form.getValues('result') === 'Effective') {
      form.setValue('result', 'Ineffective');
      toast.warning("Zero Tolerance: Status diset ke Ineffective karena ada kontrol yang gagal.");
    }
  }, [anySampleFailed, form]);

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={30} minSize={20}>
          <div className="h-full relative bg-slate-50 border-r overflow-hidden">
            {diagram ? (
              <ReactFlow nodes={diagram.nodes} edges={diagram.edges} nodeTypes={nodeTypes} fitView>
                <Background color="#cbd5e1" gap={16} />
                <Controls />
              </ReactFlow>
            ) : <div className="h-full flex flex-col items-center justify-center opacity-20"><LayoutDashboard className="h-12 w-12 mb-2" /><p className="text-xs font-bold uppercase">No Diagram Linked</p></div>}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={70}>
          <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto bg-white p-6 relative">
              {view === 'list' ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Assessment History</h3>
                    <Button onClick={() => setView('form')} className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs gap-2">
                      + New Assessment
                    </Button>
                  </div>
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-[10px] font-black uppercase">Period</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-center">Result</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Date</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isListLoading ? (
                        <TableRow><TableCell colSpan={4} className="h-24 text-center"><RefreshCw className="animate-spin inline-block mr-2" /> Loading...</TableCell></TableRow>
                      ) : csaList?.items.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">No history found.</TableCell></TableRow>
                      ) : csaList?.items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-bold text-xs">{item.period}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn(
                              "text-[9px] font-black uppercase",
                              item.result === 'Effective' ? "bg-green-600" : "bg-red-600"
                            )}>{item.result}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">{new Date(item.assessmentDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => { setActiveCsaId(item.id); setView('form'); }}><Eye className="h-3.5 w-3.5" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                        <FormField control={form.control} name="period" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Periode</FormLabel><FormControl><Input {...field} disabled={isReadOnly} className="h-9 font-bold text-xs" /></FormControl></FormItem>
                        )} />
                        <div className="col-span-2">
                          <FormField control={form.control} name="result" render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-[10px] font-black uppercase text-slate-400">Hasil Akhir (SK-5)</FormLabel>
                              <FormControl>
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4" disabled={isReadOnly}>
                                  {['Effective', 'Ineffective', 'No Transaction'].map(res => (
                                    <div key={res} className="flex items-center space-x-2">
                                      <RadioGroupItem value={res} id={res} disabled={res === 'Effective' && anySampleFailed} />
                                      <label htmlFor={res} className={cn("text-xs font-bold", res === 'Effective' ? "text-green-700" : "text-red-700")}>{res}</label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                            </FormItem>
                          )} />
                        </div>
                      </div>

                      <FormField control={form.control} name="isBpmConfirmed" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isReadOnly} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-xs font-bold text-indigo-900 cursor-pointer">
                              Konfirmasi Konsistensi BPM
                            </FormLabel>
                            <p className="text-[10px] text-indigo-700 leading-tight">
                              Sesuai regulasi SK-5 Bab IV Bagian 2.2a, saya mengonfirmasi alur proses dan narasi kontrol masih sesuai dengan kondisi riil.
                            </p>
                          </div>
                        </FormItem>
                      )} />
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-slate-700 flex items-center gap-2">
                        <Database className="h-3.5 w-3.5" /> CSA Table (Multi-Control)
                      </h4>
                      <div className="border rounded-xl overflow-x-auto shadow-sm">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow className="divide-x">
                              <TableHead className="w-10 text-[9px] font-bold">#</TableHead>
                              <TableHead className="text-[9px] font-bold min-w-[200px]">Sample Reference</TableHead>
                              <TooltipProvider>
                                {controls.map(ctrl => (
                                  <TableHead key={ctrl.id} className="text-[9px] font-black text-center uppercase tracking-tighter w-24">
                                    <Tooltip>
                                      <TooltipTrigger className="w-full h-full cursor-help">{ctrl.code}</TooltipTrigger>
                                      <TooltipContent className="bg-slate-900 text-white p-2 text-[10px] max-w-xs">
                                        <p className="font-bold">{ctrl.name}</p>
                                        <p className="opacity-80 mt-1 italic">{ctrl.description}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TableHead>
                                ))}
                              </TooltipProvider>
                              <TableHead className="text-[9px] font-bold w-24 text-center">Evidence</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {fields.map((field, sIdx) => (
                              <TableRow key={field.id} className="divide-x hover:bg-slate-50/50 transition-colors">
                                <TableCell className="text-[10px] font-bold text-slate-400 text-center">{sIdx + 1}</TableCell>
                                <TableCell className="text-[10px] font-medium py-1 px-3">
                                  <div className="font-bold text-slate-900">{field.sampleRef}</div>
                                  <div className="text-[9px] text-slate-400">ID: {field.glRowId?.substring(0,8)}</div>
                                </TableCell>
                                {controls.map(ctrl => (
                                  <TableCell key={ctrl.id} className="text-center p-0">
                                    <FormField control={form.control} name={`samples.${sIdx}.controlResults.${ctrl.id}.implemented`} render={({ field }) => (
                                      <div className="flex items-center justify-center h-full min-h-[40px]">
                                        <Checkbox 
                                          checked={field.value} 
                                          onCheckedChange={field.onChange} 
                                          disabled={isReadOnly} 
                                          className={cn("h-5 w-5", field.value ? "text-green-600" : "text-red-600")}
                                        />
                                      </div>
                                    )} />
                                  </TableCell>
                                ))}
                                <TableCell className="text-center py-1">
                                   <Button variant="outline" size="icon" className="h-7 w-7"><FileText className="h-3.5 w-3.5 text-slate-400" /></Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg border border-slate-200">
                         <div className="flex gap-4">
                           <div className="text-center">
                             <p className="text-[9px] font-black uppercase text-slate-400">Controls</p>
                             <p className="text-sm font-black text-slate-700">{controls.length}</p>
                           </div>
                           <div className="text-center">
                             <p className="text-[9px] font-black uppercase text-slate-400">Samples</p>
                             <p className="text-sm font-black text-slate-700">{fields.length}</p>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Poin Verifikasi / Evidence</p>
                           <p className="text-lg font-black text-indigo-600">{(controls.length * fields.length)} Bukti</p>
                         </div>
                      </div>
                    </div>

                    <FormField control={form.control} name="comments" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400">Catatan / Temuan</FormLabel>
                        <FormControl><Textarea {...field} disabled={isReadOnly} className="min-h-[100px] text-xs" placeholder="Wajib diisi jika status INEFFECTIVE..." /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {!isReadOnly && (
                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setView('list')}>Batal</Button>
                        <Button disabled={createMutation.isPending || isAuthenticating} type="submit" className="bg-indigo-600 hover:bg-indigo-700 font-bold px-8 h-10 gap-2 shadow-lg">
                           {isAuthenticating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                           Submit & Sign-off (Manager)
                        </Button>
                      </div>
                    )}
                  </form>
                </Form>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
