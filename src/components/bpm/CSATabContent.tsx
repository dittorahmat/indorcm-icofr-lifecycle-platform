import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  UploadCloud, File as FileIcon, X, UserCheck, Activity, Database, FileText, LayoutDashboard,
  Printer, History, Send, XCircle, Plus, ChevronLeft, Eye, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Control, CSARecord, CSATestSample, User } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { analyzeEvidenceMetadata, promptBiometricAuth, EvidenceMetadata } from '@/lib/forensic-utils';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  comments: z.string().min(5, "Comments must be at least 5 characters"),
  samples: z.array(z.object({
    sampleRef: z.string().min(1, "Ref required"),
    attributeResults: z.object({
      A: z.boolean(),
      B: z.boolean(),
      C: z.boolean(),
      D: z.boolean(),
    }),
    itacResults: z.object({
      expectedResult: z.string().optional(),
      actualResult: z.string().optional(),
      isMatch: z.boolean(),
    }).optional()
  })).min(1, "At least one sample is required"),
  itacScenario: z.string().optional(),
  itacMethod: z.string().optional(),
  itacSampleInfo: z.string().optional(),
});

type CSAFormValues = z.infer<typeof csaFormSchema>;

interface CSATabContentProps {
  noGL: string;
  controls: Control[];
}

export function CSATabContent({ noGL, controls }: CSATabContentProps) {
  const { t } = useTranslation(['bpm', 'common']);
  const queryClient = useQueryClient();
  
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [activeCsaId, setActiveCsaId] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Initial Control Selection
  useEffect(() => {
    if (!selectedControlId && controls.length > 0) {
      setSelectedControlId(controls[0].id);
    }
  }, [controls, selectedControlId]);

  const selectedControl = useMemo(() => controls.find(c => c.id === selectedControlId), [controls, selectedControlId]);

  // Queries
  const { data: diagram, isLoading: isDiagLoading } = useQuery({
    queryKey: ['bpm-diagrams', 'by-gl', noGL],
    queryFn: () => api<any>(`/api/bpm-diagrams/by-gl/${noGL}`),
  });

  const { data: csaList, isLoading: isListLoading } = useQuery({
    queryKey: ['csa-list', selectedControlId],
    queryFn: () => api<{ items: CSARecord[] }>(`/api/csa?controlId=${selectedControlId}`),
    enabled: !!selectedControlId
  });

  const { data: activeCsa, isLoading: isDetailLoading } = useQuery({
    queryKey: ['csa-detail', activeCsaId],
    queryFn: () => api<CSARecord>(`/api/csa/${activeCsaId}`),
    enabled: !!activeCsaId && view === 'form'
  });

  // Highlight logic for diagram
  const highlightedNodeId = useMemo(() => {
    if (!diagram || !selectedControlId) return null;
    return diagram.nodes?.find((n: any) => 
      n.data?.controlIds?.includes(selectedControlId) || 
      n.data?.risks?.some((r: any) => r.controlIds?.includes(selectedControlId))
    )?.id || null;
  }, [diagram, selectedControlId]);

  const nodes = useMemo(() => (diagram?.nodes || []).map((n: any) => ({
    ...n, draggable: false, data: { ...n.data, highlight: n.id === highlightedNodeId }
  })), [diagram, highlightedNodeId]);

  const edges = diagram?.edges || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api('/api/csa', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("CSA Sign-off successful");
      queryClient.invalidateQueries({ queryKey: ['csa-list'] });
      setView('list');
    }
  });

  const form = useForm<CSAFormValues>({
    resolver: zodResolver(csaFormSchema),
    defaultValues: {
      period: '2024-Q1',
      result: 'Effective',
      comments: '',
      samples: [{ sampleRef: '', attributeResults: { A: true, B: true, C: true, D: true } }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "samples"
  });

  // Sync activeCsa to form when viewing/loading
  useEffect(() => {
    if (activeCsa) {
      form.reset({
        period: activeCsa.period,
        result: activeCsa.result,
        comments: activeCsa.comments || '',
        samples: activeCsa.samples || [],
        itacScenario: activeCsa.itacScenario,
        itacMethod: activeCsa.itacMethod,
        itacSampleInfo: activeCsa.itacSampleInfo,
      });
    }
  }, [activeCsa, form]);

  const onSubmit = async (values: CSAFormValues) => {
    setIsAuthenticating(true);
    const verified = await promptBiometricAuth('authenticate');
    setIsAuthenticating(false);

    if (!verified) {
      toast.error("Sign-off authentication failed");
      return;
    }

    // Aggregating Attr A-D for summary fields
    const attrA = values.samples.every(s => s.attributeResults.A);
    const attrB = values.samples.every(s => s.attributeResults.B);
    const attrC = values.samples.every(s => s.attributeResults.C);
    const attrD = values.samples.every(s => s.attributeResults.D);

    createMutation.mutate({
      ...values,
      controlId: selectedControlId,
      attrA, attrB, attrC, attrD,
      hash: crypto.randomUUID().split('-')[0].toUpperCase() // Dummy hash for forensic
    });
  };

  const handlePrint = (id: string) => {
    window.open(`/api/csa/${id}/export-pdf`, '_blank');
  };

  const isReadOnly = !!activeCsaId;

  if (!controls || controls.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 border rounded-xl border-dashed p-12 text-center">
        <ShieldCheck className="h-12 w-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-900">No Controls Found</h3>
        <p className="text-sm text-muted-foreground max-w-xs mt-2">
          This sub-process doesn't have any controls mapped yet. Please add controls in the Worksheet tab first.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border shadow-sm overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left: Visual Context */}
        <ResizablePanel defaultSize={35} minSize={20}>
          <div className="h-full relative bg-slate-50 border-r overflow-hidden">
            {isDiagLoading ? (
              <div className="h-full flex items-center justify-center"><RefreshCw className="animate-spin text-indigo-600" /></div>
            ) : diagram ? (
              <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView nodesDraggable={false} nodesConnectable={false}>
                <Background color="#cbd5e1" gap={16} />
                <Controls />
              </ReactFlow>
            ) : <div className="h-full flex flex-col items-center justify-center opacity-20"><LayoutDashboard className="h-12 w-12 mb-2" /><p className="text-xs font-bold uppercase">No Diagram Linked</p></div>}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: CSA Workspace */}
        <ResizablePanel defaultSize={65}>
          <div className="h-full flex flex-col overflow-hidden">
            {/* Control Header */}
            <div className="p-4 border-b bg-slate-50/50 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Control Point Selection</p>
                {view === 'form' && (
                  <Button variant="ghost" size="sm" onClick={() => { setView('list'); setActiveCsaId(null); form.reset(); }} className="h-7 text-[10px] font-bold gap-1">
                    <ChevronLeft className="h-3 w-3" /> {t('csa.backToList')}
                  </Button>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {controls.map(c => (
                  <Button
                    key={c.id}
                    variant={selectedControlId === c.id ? "default" : "outline"}
                    size="sm"
                    disabled={view === 'form'}
                    className={cn("h-7 text-[9px] font-black uppercase whitespace-nowrap", selectedControlId === c.id ? "bg-indigo-600" : "bg-white")}
                    onClick={() => setSelectedControlId(c.id)}
                  >
                    {c.code}
                  </Button>
                ))}
              </div>
            </div>

            {/* List or Form View */}
            <div className="flex-1 overflow-y-auto bg-white p-6 relative">
              {view === 'list' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">{selectedControl?.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-md italic">{selectedControl?.description}</p>
                    </div>
                    <Button onClick={() => setView('form')} className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs gap-2">
                      <Plus className="h-4 w-4" /> {t('csa.newButton')}
                    </Button>
                  </div>

                  <Separator />

                  <div className="border rounded-xl overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-[100px] text-[10px] font-black uppercase">{t('csa.form.period')}</TableHead>
                          <TableHead className="text-[10px] font-black uppercase text-center">{t('csa.form.result')}</TableHead>
                          <TableHead className="text-[10px] font-black uppercase">Sign-off Date</TableHead>
                          <TableHead className="text-right text-[10px] font-black uppercase">{t('table.action')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isListLoading ? (
                          <TableRow><TableCell colSpan={4} className="h-24 text-center"><RefreshCw className="animate-spin inline-block mr-2" /> Loading records...</TableCell></TableRow>
                        ) : csaList?.items.length === 0 ? (
                          <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">No assessment history found for this control.</TableCell></TableRow>
                        ) : csaList?.items.map(item => (
                          <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="font-bold text-xs">{item.period}</TableCell>
                            <TableCell className="text-center">
                              <Badge className={cn(
                                "text-[9px] font-black uppercase",
                                item.result === 'Effective' ? "bg-green-600" : item.result === 'Ineffective' ? "bg-red-600" : "bg-slate-400"
                              )}>{item.result}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 font-medium">
                              {new Date(item.assessmentDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => { setActiveCsaId(item.id); setView('form'); }}><Eye className="h-3.5 w-3.5" /></Button>
                              <Button variant="outline" size="icon" className="h-7 w-7 text-indigo-600" onClick={() => handlePrint(item.id)}><Printer className="h-3.5 w-3.5" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                      {/* Section I & II: Metadata */}
                      <div className="grid grid-cols-3 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                        <FormField control={form.control} name="period" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">{t('csa.form.period')}</FormLabel><FormControl><Input {...field} disabled={isReadOnly} className="h-9 font-bold text-xs" /></FormControl></FormItem>
                        )} />
                        <div className="col-span-2">
                          <FormField control={form.control} name="result" render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-[10px] font-black uppercase text-slate-400">{t('csa.form.result')} (SK-5)</FormLabel>
                              <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4" disabled={isReadOnly}>
                                  {['Effective', 'Ineffective', 'No Transaction'].map(res => (
                                    <FormItem key={res} className="flex items-center space-x-2 space-y-0">
                                      <FormControl><RadioGroupItem value={res} /></FormControl>
                                      <FormLabel className={cn("text-xs font-bold cursor-pointer", res === 'Effective' ? "text-green-700" : res === 'Ineffective' ? "text-red-700" : "text-slate-500")}>{res}</FormLabel>
                                    </FormItem>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                            </FormItem>
                          )} />
                        </div>
                      </div>

                      {/* ITAC Header (Optional) */}
                      {(selectedControl?.nature === 'Automated' || selectedControl?.nature?.startsWith('ITDM')) && (
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg grid grid-cols-2 gap-4">
                           <FormField control={form.control} name="itacScenario" render={({ field }) => (
                             <FormItem><FormLabel className="text-[10px] font-black text-blue-600 uppercase">{t('csa.itac.scenario')}</FormLabel><FormControl><Input {...field} disabled={isReadOnly} className="h-8 text-xs bg-white" /></FormControl></FormItem>
                           )} />
                           <FormField control={form.control} name="itacMethod" render={({ field }) => (
                             <FormItem><FormLabel className="text-[10px] font-black text-blue-600 uppercase">{t('csa.itac.method')}</FormLabel><FormControl><Input {...field} disabled={isReadOnly} className="h-8 text-xs bg-white" /></FormControl></FormItem>
                           )} />
                        </div>
                      )}

                      {/* Section III: Dynamic Samples Table */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                           <h4 className="text-xs font-black uppercase flex items-center gap-2 text-slate-700">
                             <Database className="h-3.5 w-3.5" /> {t('csa.section3')} (Zero Tolerance)
                           </h4>
                           {!isReadOnly && (
                             <Button type="button" variant="outline" size="sm" onClick={() => append({ sampleRef: '', attributeResults: { A: true, B: true, C: true, D: true } })} className="h-7 text-[10px] font-bold">
                               <Plus className="h-3 w-3 mr-1" /> {t('common:actions.addSample')}
                             </Button>
                           )}
                        </div>
                        
                        <div className="border rounded-xl overflow-hidden">
                          <Table>
                            <TableHeader className="bg-slate-50">
                              <TableRow>
                                <TableHead className="w-10 text-[9px] font-bold">#</TableHead>
                                <TableHead className="text-[9px] font-bold">Reference (Voucher/Doc)</TableHead>
                                {selectedControl?.nature === 'Automated' ? (
                                  <>
                                    <TableHead className="text-[9px] font-bold text-center">Expected</TableHead>
                                    <TableHead className="text-[9px] font-bold text-center">Actual</TableHead>
                                    <TableHead className="text-[9px] font-bold text-center">Match?</TableHead>
                                  </>
                                ) : (
                                  <>
                                    <TableHead className="text-[9px] font-bold text-center">Attr A</TableHead>
                                    <TableHead className="text-[9px] font-bold text-center">Attr B</TableHead>
                                    <TableHead className="text-[9px] font-bold text-center">Attr C</TableHead>
                                    <TableHead className="text-[9px] font-bold text-center">Attr D</TableHead>
                                  </>
                                )}
                                {!isReadOnly && <TableHead className="w-10"></TableHead>}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {fields.map((field, index) => (
                                <TableRow key={field.id}>
                                  <TableCell className="text-xs font-bold text-slate-400">{index + 1}</TableCell>
                                  <TableCell>
                                    <FormField control={form.control} name={`samples.${index}.sampleRef`} render={({ field }) => (
                                      <FormControl><Input {...field} disabled={isReadOnly} className="h-8 text-xs border-none bg-transparent focus-visible:ring-0 shadow-none p-0" placeholder="INV-2024-..." /></FormControl>
                                    )} />
                                  </TableCell>
                                  
                                  {selectedControl?.nature === 'Automated' ? (
                                    <>
                                      <TableCell>
                                        <FormField control={form.control} name={`samples.${index}.itacResults.expectedResult`} render={({ field }) => (
                                          <FormControl><Input {...field} disabled={isReadOnly} className="h-8 text-xs border-none bg-transparent" /></FormControl>
                                        )} />
                                      </TableCell>
                                      <TableCell>
                                        <FormField control={form.control} name={`samples.${index}.itacResults.actualResult`} render={({ field }) => (
                                          <FormControl><Input {...field} disabled={isReadOnly} className="h-8 text-xs border-none bg-transparent" /></FormControl>
                                        )} />
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <FormField control={form.control} name={`samples.${index}.itacResults.isMatch`} render={({ field }) => (
                                          <FormControl>
                                            <Checkbox 
                                              checked={field.value} 
                                              onCheckedChange={(val) => {
                                                field.onChange(val);
                                                if (val === false) form.setValue('result', 'Ineffective');
                                              }} 
                                              disabled={isReadOnly} 
                                            />
                                          </FormControl>
                                        )} />
                                      </TableCell>
                                    </>
                                  ) : (
                                    ['A', 'B', 'C', 'D'].map(attr => (
                                      <TableCell key={attr} className="text-center">
                                        <FormField control={form.control} name={`samples.${index}.attributeResults.${attr}` as any} render={({ field }) => (
                                          <FormControl>
                                            <Checkbox 
                                              checked={field.value} 
                                              onCheckedChange={(val) => {
                                                field.onChange(val);
                                                // Zero Tolerance Logic: If any false, suggest Ineffective
                                                if (val === false) {
                                                  form.setValue('result', 'Ineffective');
                                                  toast.warning("Zero tolerance: One failed attribute suggested as Ineffective result.");
                                                }
                                              }} 
                                              disabled={isReadOnly} 
                                            />
                                          </FormControl>
                                        )} />
                                      </TableCell>
                                    ))
                                  )}
                                  {!isReadOnly && (
                                    <TableCell>
                                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-6 w-6 text-slate-300 hover:text-red-600"><X className="h-3 w-3" /></Button>
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* Section IV: Comments & Sign-off */}
                      <FormField control={form.control} name="comments" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase text-slate-400">{t('csa.form.comments')}</FormLabel>
                          <FormControl><Textarea {...field} disabled={isReadOnly} className="min-h-[100px] text-xs" placeholder="Describe remediation plan if ineffective..." /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {!isReadOnly && (
                        <div className="flex justify-end pt-4">
                          <Button disabled={createMutation.isPending || isAuthenticating} type="submit" className="bg-indigo-600 hover:bg-indigo-700 font-bold px-8 h-10 gap-2">
                             {isAuthenticating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                             {t('csa.form.signOff')}
                          </Button>
                        </div>
                      )}
                    </form>
                  </Form>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
