import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  NodeProps,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { 
  RefreshCw, ShieldCheck, CheckCircle2, AlertTriangle, 
  UploadCloud, File as FileIcon, X, UserCheck, Activity, Database, FileText, LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Control, CSARecord } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
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

// --- Simplified Read-only Nodes ---

const BaseNode = ({ children, highlight }: { children: React.ReactNode, highlight?: boolean }) => (
  <div className={cn(
    "transition-all relative",
    highlight && "ring-8 ring-yellow-400 ring-offset-4 rounded-lg animate-pulse scale-110 z-50"
  )}>
    {children}
  </div>
);

const ActivityNode = ({ data, type }: NodeProps) => (
  <BaseNode highlight={data.highlight}>
    <div className="px-4 py-3 shadow-md rounded-sm bg-white border-2 border-slate-800 min-w-[160px] text-center">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="font-bold text-[9px] mb-1.5 uppercase text-slate-500 border-b pb-1 flex items-center justify-center gap-1">
        {type === 'automated-activity' ? <Database className="h-2.5 w-2.5" /> : <Activity className="h-2.5 w-2.5" />}
        {data.role || (type === 'automated-activity' ? "SYSTEM" : "Role")}
      </div>
      <div className="text-[12px] font-semibold text-slate-800 leading-tight">{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  </BaseNode>
);

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

const DecisionNode = ({ data }: NodeProps) => (
  <div className="relative flex items-center justify-center w-[80px] h-[80px]">
    <div className="absolute inset-0 border-2 rotate-45 transform shadow-md flex items-center justify-center bg-white border-slate-800">
       <div className="-rotate-45 text-center text-[9px] px-2 font-bold leading-tight uppercase text-slate-700">{data.label}</div>
    </div>
  </div>
);

const nodeTypes = {
  start: StartEndNode,
  end: StartEndNode,
  activity: ActivityNode,
  'automated-activity': ActivityNode,
  decision: DecisionNode,
  document: ({ data }: NodeProps) => <div className="px-3 py-2 border-2 border-slate-800 bg-white text-[10px] font-bold uppercase rounded-br-lg flex items-center gap-2"><FileText className="h-3 w-3" /> {data.label}</div>,
  system: ({ data }: NodeProps) => <div className="px-3 py-2 border-2 border-blue-800 bg-blue-50 text-[10px] font-bold uppercase flex flex-col items-center gap-1"><Database className="h-3 w-3" /> {data.label}</div>,
  risk: ({ data }: NodeProps) => <div className="w-10 h-8 bg-red-600 flex items-center justify-center text-white"><AlertTriangle className="h-4 w-4" /></div>,
  control: ({ data }: NodeProps) => <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white"><ShieldCheck className="h-4 w-4" /></div>,
};

const csaSchema = z.object({
  result: z.enum(['Effective', 'Ineffective', 'No Transaction']),
  comments: z.string().min(5, "Comments must be at least 5 characters"),
  transReference: z.string().optional(),
  attrA: z.boolean().default(false),
  attrB: z.boolean().default(false),
  attrC: z.boolean().default(false),
  attrD: z.boolean().default(false),
  itacScenario: z.string().optional(),
  itacMethod: z.string().optional(),
  itacSampleInfo: z.string().optional(),
});

interface CSATabContentProps {
  noGL: string;
  controls: Control[];
}

export function CSATabContent({ noGL, controls }: CSATabContentProps) {
  const queryClient = useQueryClient();
  const [selectedControlId, setSelectedControlId] = useState<string | null>(controls[0]?.id || null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [evidenceMeta, setEvidenceMeta] = useState<EvidenceMetadata | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const selectedControl = useMemo(() => controls.find(c => c.id === selectedControlId), [controls, selectedControlId]);

  // Fetch diagram for this GL
  const { data: diagram, isLoading: isDiagLoading } = useQuery({
    queryKey: ['bpm-diagrams', 'by-gl', noGL],
    queryFn: () => api<any>(`/api/bpm-diagrams/by-gl/${noGL}`),
  });

  // Fetch existing CSA record if any
  const { data: existingCsa, isLoading: isCsaLoading } = useQuery({
    queryKey: ['csa-record', selectedControlId],
    queryFn: async () => {
      const res = await api<{ items: CSARecord[] }>(`/api/csa`);
      return res.items.filter(item => item.controlId === selectedControlId).sort((a, b) => b.assessmentDate - a.assessmentDate)[0];
    },
    enabled: !!selectedControlId
  });

  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);

  // Find which node contains the selected control
  const highlightedNodeId = useMemo(() => {
    if (!diagram || !selectedControlId) return null;
    const nodes = diagram.nodes || [];
    const node = nodes.find((n: any) => n.data?.controlIds?.includes(selectedControlId) || n.data?.risks?.some((r: any) => r.controlIds?.includes(selectedControlId)));
    return node?.id || null;
  }, [diagram, selectedControlId]);

  useEffect(() => {
    if (diagram) {
      const hydratedNodes = (diagram.nodes || []).map((n: any) => ({
        ...n,
        draggable: false,
        data: {
          ...n.data,
          highlight: n.id === highlightedNodeId
        }
      }));
      setNodes(hydratedNodes);
      setEdges(diagram.edges || []);
    }
  }, [diagram, highlightedNodeId, setNodes, setEdges]);

  const form = useForm<z.infer<typeof csaSchema>>({
    resolver: zodResolver(csaSchema),
    defaultValues: {
      result: 'Effective',
      comments: '',
      attrA: false,
      attrB: false,
      attrC: false,
      attrD: false,
    }
  });

  useEffect(() => {
    if (existingCsa) {
      form.reset({
        result: existingCsa.result,
        comments: existingCsa.comments,
        transReference: existingCsa.transReference || '',
        attrA: existingCsa.attrA,
        attrB: existingCsa.attrB,
        attrC: existingCsa.attrC,
        attrD: existingCsa.attrD,
        itacScenario: existingCsa.itacScenario || '',
        itacMethod: existingCsa.itacMethod || '',
        itacSampleInfo: existingCsa.itacSampleInfo || '',
      });
      if (existingCsa.evidenceUrl) setPreview(null);
    } else {
      form.reset({
        result: 'Effective',
        comments: '',
        attrA: false,
        attrB: false,
        attrC: false,
        attrD: false,
        transReference: '',
        itacScenario: '',
        itacMethod: '',
        itacSampleInfo: '',
      });
      setEvidenceFile(null);
      setPreview(null);
      setEvidenceMeta(null);
    }
  }, [existingCsa, form]);

  const mutation = useMutation({
    mutationFn: (data: Partial<CSARecord>) => api('/api/csa', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Assessment submitted successfully");
      queryClient.invalidateQueries({ queryKey: ['csa-record'] });
      queryClient.invalidateQueries({ queryKey: ['deficiencies'] });
    }
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setEvidenceFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);

      if (file.type.startsWith('image/')) {
        setIsAnalyzing(true);
        const meta = await analyzeEvidenceMetadata(file);
        setEvidenceMeta(meta);
        setIsAnalyzing(false);
        toast.success("Forensic metadata analyzed");
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  async function onSubmit(values: z.infer<typeof csaSchema>) {
    setIsAuthenticating(true);
    const verified = await promptBiometricAuth();
    setIsAuthenticating(false);

    if (!verified) {
      toast.error("Biometric verification failed");
      return;
    }

    mutation.mutate({
      controlId: selectedControlId!,
      ...values,
      evidenceUrl: evidenceFile ? `mock-uploads/${evidenceFile.name}` : undefined,
      gpsVerified: evidenceMeta?.gpsVerified,
      latitude: evidenceMeta?.latitude,
      longitude: evidenceMeta?.longitude,
      timestampVerified: evidenceMeta?.timestampVerified,
      capturedAt: evidenceMeta?.capturedAt?.getTime(),
      hash: evidenceMeta?.hash,
      biometricVerified: true
    });
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border shadow-sm overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Panel: Diagram Context */}
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full relative bg-slate-50 border-r overflow-hidden">
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-lg border shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Visual Context</p>
              <p className="text-xs font-bold text-slate-700">Highlighting active control point</p>
            </div>
            {isDiagLoading ? (
              <div className="h-full flex items-center justify-center"><RefreshCw className="animate-spin text-indigo-600" /></div>
            ) : diagram ? (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
              >
                <Background color="#cbd5e1" gap={16} />
                <Controls />
              </ReactFlow>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center italic">
                <LayoutDashboard className="h-12 w-12 opacity-20 mb-4" />
                <p>No diagram linked to this account ({noGL}).</p>
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel: Selection & Form */}
        <ResizablePanel defaultSize={60}>
          <div className="h-full flex flex-col overflow-hidden">
            {/* Control Selector Strip - Fixed Height */}
            <div className="p-4 border-b bg-slate-50/50 flex-shrink-0">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Controls for Assessment</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {controls.map(c => (
                  <Button
                    key={c.id}
                    variant={selectedControlId === c.id ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-8 text-[10px] font-bold whitespace-nowrap",
                      selectedControlId === c.id ? "bg-indigo-600" : "bg-white"
                    )}
                    onClick={() => setSelectedControlId(c.id)}
                  >
                    {c.code}
                  </Button>
                ))}
              </div>
            </div>

            {/* Scrollable Container with absolute child to force bounds */}
            <div className="flex-1 relative min-h-0 bg-white">
              {selectedControl ? (
                <div className="absolute inset-0 flex flex-col overflow-hidden">
                  <Form {...form}>
                    <form 
                      onSubmit={form.handleSubmit(onSubmit)} 
                      className="flex-1 flex flex-col overflow-hidden"
                    >
                      {/* Scrollable Content Area */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{selectedControl.name}</h3>
                            <p className="text-sm text-muted-foreground">{selectedControl.description}</p>
                          </div>
                          {existingCsa && (
                            <Badge className={cn(
                              "uppercase font-black text-[10px]",
                              existingCsa.result === 'Effective' ? "bg-green-600" : existingCsa.result === 'Ineffective' ? "bg-red-600" : "bg-slate-500"
                            )}>
                              Last Result: {existingCsa.result}
                            </Badge>
                          )}
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            {/* 1. Result Selection */}
                            <FormField
                              control={form.control}
                              name="result"
                              render={({ field }) => (
                                <FormItem className="space-y-3">
                                  <FormLabel className="text-sm font-bold uppercase tracking-wider text-slate-500">Assessment Result</FormLabel>
                                  <FormControl>
                                    <RadioGroup
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                      className="flex flex-col gap-2"
                                      disabled={!!existingCsa}
                                    >
                                      <FormItem className={cn(
                                        "flex items-center space-x-3 space-y-0 border rounded-lg p-3 cursor-pointer transition-all",
                                        field.value === 'Effective' ? "bg-green-50 border-green-200" : "hover:bg-slate-50"
                                      )}>
                                        <FormControl><RadioGroupItem value="Effective" /></FormControl>
                                        <FormLabel className="font-semibold text-green-800 cursor-pointer">Effective</FormLabel>
                                      </FormItem>
                                      <FormItem className={cn(
                                        "flex items-center space-x-3 space-y-0 border rounded-lg p-3 cursor-pointer transition-all",
                                        field.value === 'Ineffective' ? "bg-red-50 border-red-200" : "hover:bg-slate-50"
                                      )}>
                                        <FormControl><RadioGroupItem value="Ineffective" /></FormControl>
                                        <FormLabel className="font-semibold text-red-800 cursor-pointer">Ineffective</FormLabel>
                                      </FormItem>
                                      <FormItem className={cn(
                                        "flex items-center space-x-3 space-y-0 border rounded-lg p-3 cursor-pointer transition-all",
                                        field.value === 'No Transaction' ? "bg-slate-100 border-slate-300" : "hover:bg-slate-50"
                                      )}>
                                        <FormControl><RadioGroupItem value="No Transaction" /></FormControl>
                                        <FormLabel className="font-semibold text-slate-600 cursor-pointer">No Transaction</FormLabel>
                                      </FormItem>
                                    </RadioGroup>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* 2. Attributes Checklist (SK-5) */}
                            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                              <p className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-2">
                                <ShieldCheck className="h-3 w-3" /> Regulatory Attributes (Lampiran 7)
                              </p>
                              <div className="space-y-3">
                                <FormField
                                  control={form.control}
                                  name="attrA"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={!!existingCsa} /></FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel className="text-xs font-medium">A: Control Objective Achieved?</FormLabel>
                                      </div>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="attrB"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={!!existingCsa} /></FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel className="text-xs font-medium">B: Performed consistently with policy?</FormLabel>
                                      </div>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="attrC"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={!!existingCsa} /></FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel className="text-xs font-medium">C: Performed by authorized/competent personnel?</FormLabel>
                                      </div>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="attrD"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={!!existingCsa} /></FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel className="text-xs font-medium">D: Supporting evidence is valid and sufficient?</FormLabel>
                                      </div>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                            {/* 3. Transaction Reference */}
                            <FormField
                              control={form.control}
                              name="transReference"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-bold uppercase text-slate-500">Test of One Reference</FormLabel>
                                  <FormControl><Input {...field} placeholder="e.g. INV/2024/001" className="bg-white" disabled={!!existingCsa} /></FormControl>
                                  <FormDescription className="text-[10px]">Reference ID for the specific transaction sample evaluated.</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* 4. Comments */}
                            <FormField
                              control={form.control}
                              name="comments"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-bold uppercase text-slate-500">Detailed Comments</FormLabel>
                                  <FormControl><Textarea {...field} placeholder="Explain the evaluation results..." className="min-h-[100px] bg-white" disabled={!!existingCsa} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* 5. ITAC Fields (Conditional) */}
                            {(selectedControl.nature === 'Automated' || selectedControl.nature?.startsWith('ITDM')) && (
                              <div className="space-y-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                 <p className="text-[10px] font-black text-blue-700 uppercase flex items-center gap-2">
                                  <Database className="h-3 w-3" /> ITAC/ITDM Details (Lampiran 7)
                                </p>
                                <FormField control={form.control} name="itacScenario" render={({ field }) => (
                                  <FormItem><FormLabel className="text-[10px] uppercase font-bold text-blue-600">Skenario ITAC</FormLabel><FormControl><Input {...field} className="h-8 text-xs bg-white" disabled={!!existingCsa} /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="itacMethod" render={({ field }) => (
                                  <FormItem><FormLabel className="text-[10px] uppercase font-bold text-blue-600">Metode Pengujian</FormLabel><FormControl><Input {...field} className="h-8 text-xs bg-white" disabled={!!existingCsa} /></FormControl></FormItem>
                                )} />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 6. Evidence & Forensics */}
                        <div className="space-y-4 pb-4">
                          <Label className="text-xs font-bold uppercase text-slate-500">Forensic Evidence (FR10)</Label>
                          {!existingCsa ? (
                            <div {...getRootProps()} className={cn(
                              "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all cursor-pointer",
                              isDragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                            )}>
                              <input {...getInputProps()} />
                              <UploadCloud className="h-10 w-10 text-slate-400 mb-3" />
                              <p className="text-sm font-medium text-slate-600">Drag & drop evidence file, or click to browse</p>
                              <p className="text-xs text-slate-400 mt-1">Images will be automatically scanned for GPS & Timestamp</p>
                            </div>
                          ) : null}

                          {preview || existingCsa?.evidenceUrl ? (
                            <div className="p-4 border rounded-xl bg-slate-50 flex items-start gap-4">
                              <div className="h-16 w-16 bg-white border rounded flex items-center justify-center overflow-hidden">
                                {preview && preview.startsWith('data:image') ? (
                                  <img src={preview} alt="Evidence" className="h-full w-full object-cover" />
                                ) : (
                                  <FileIcon className="h-8 w-8 text-slate-400" />
                                )}
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className="text-sm font-bold text-slate-700">{evidenceFile?.name || "Uploaded Evidence"}</p>
                                {isAnalyzing ? (
                                  <p className="text-[10px] text-indigo-600 font-bold animate-pulse flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> ANALYZING METADATA...</p>
                                ) : evidenceMeta ? (
                                  <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className={cn("text-[9px] gap-1", evidenceMeta.gpsVerified ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50")}>
                                      {evidenceMeta.gpsVerified ? <CheckCircle2 className="h-3 w-3"/> : <AlertTriangle className="h-3 w-3"/>} GPS: {evidenceMeta.gpsVerified ? 'VERIFIED' : 'INVALID'}
                                    </Badge>
                                    <Badge variant="outline" className={cn("text-[9px] gap-1", evidenceMeta.timestampVerified ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50")}>
                                      {evidenceMeta.timestampVerified ? <CheckCircle2 className="h-3 w-3"/> : <AlertTriangle className="h-3 w-3"/>} TIME: {evidenceMeta.timestampVerified ? 'VERIFIED' : 'INVALID'}
                                    </Badge>
                                  </div>
                                ) : null}
                              </div>
                              {!existingCsa && (
                                <Button variant="ghost" size="icon" onClick={() => { setEvidenceFile(null); setPreview(null); setEvidenceMeta(null); }}><X className="h-4 w-4" /></Button>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* 7. Submit Action - Fixed at bottom */}
                      {!existingCsa && (
                        <div className="p-4 border-t bg-slate-50 flex-shrink-0 flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={mutation.isPending || isAuthenticating || isAnalyzing}
                            className="bg-indigo-600 hover:bg-indigo-700 h-10 px-6 text-sm font-bold shadow-md shadow-indigo-100 gap-2"
                          >
                            {isAuthenticating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                            {mutation.isPending ? "Submitting..." : "Verify & Sign Off"}
                          </Button>                        </div>
                      )}
                    </form>
                  </Form>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
                  <ShieldCheck className="h-16 w-16 opacity-10 mb-4" />
                  <h4 className="text-lg font-bold">Select a Control</h4>
                  <p className="max-w-xs">Please select a control from the list above to begin the self-assessment.</p>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
