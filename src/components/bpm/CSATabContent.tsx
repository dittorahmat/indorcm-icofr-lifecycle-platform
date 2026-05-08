import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Printer, ChevronLeft, Eye, UploadCloud, Check, MapPin, ChevronDown, Download, Trash2
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Appendix7aDetailed } from '../reports/Appendix7aDetailed';
import { Appendix7aSummary } from '../reports/Appendix7aSummary';
import { cn } from '@/lib/utils';
import { Control, CSARecord, CSATestSample, User, GLRow, TransactionDetail, BPMProcess } from '@shared/types';
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
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// --- Simplified Read-only Nodes ---
const StartEndNode = ({ data }: NodeProps) => (
  <div className={cn(
    "px-6 py-2 shadow-md rounded-[50px] bg-white border-2 min-w-[120px] text-center",
    data.type === 'start' ? "border-green-600" : "border-red-600"
  )}>
    <Handle 
      type={data.type === 'start' ? "source" : "target"} 
      position={data.type === 'start' ? Position.Bottom : Position.Top} 
      className="opacity-0" 
    />
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
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="absolute inset-0 border-2 rotate-45 transform shadow-md flex items-center justify-center bg-white border-slate-800">
         <div className="-rotate-45 text-center text-[9px] px-2 font-bold leading-tight uppercase text-slate-700">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Left} id="no" className="opacity-0" />
      <Handle type="source" position={Position.Right} id="yes" className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  ),
  document: ({ data }: NodeProps) => (
    <div className="px-3 py-2 border-2 border-slate-800 bg-white text-[10px] font-bold uppercase rounded-br-lg flex items-center gap-2 relative">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <FileText className="h-3 w-3" /> {data.label}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  ),
  system: ({ data }: NodeProps) => (
    <div className="px-3 py-2 border-2 border-blue-800 bg-blue-50 text-[10px] font-bold uppercase flex flex-col items-center gap-1 relative">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Database className="h-3 w-3" /> {data.label}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  ),
  risk: ({ data }: NodeProps) => <div className="w-10 h-8 bg-red-600 flex items-center justify-center text-white"><AlertTriangle className="h-4 w-4" /></div>,
  control: ({ data }: NodeProps) => <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white"><ShieldCheck className="h-4 w-4" /></div>,
};

// --- Form Validation ---
const csaFormSchema = z.object({
  period: z.string().min(1, "Period is required"),
  result: z.enum(['Effective', 'Ineffective', 'No Transaction']),
  comments: z.string().optional(),
  testProcedure: z.string().optional(),
  archiveLocation: z.string().optional(),
  samplingMethodology: z.string().min(1, "Methodology is required"),
  documentList: z.string().min(1, "Document list is required"),
  isBpmConfirmed: z.boolean().refine(val => val === true, "BPM confirmation is required"),
  samples: z.array(z.object({
    id: z.string().optional(),
    sampleRef: z.string().min(1, "Ref required"),
    glRowId: z.string().optional(),
    controlResults: z.record(z.string(), z.object({
      implemented: z.boolean(),
      evidenceUrl: z.string().optional(),
      comment: z.string().optional(),
      riskId: z.string().optional(),
      riskName: z.string().optional(),
      controlName: z.string().optional()
    }))
  })).min(1, "At least one sample is required"),
});

type CSAFormValues = z.infer<typeof csaFormSchema>;

interface CSATabContentProps {
  noGL?: string;
  controls?: Control[];
  initialSamples?: (GLRow | TransactionDetail)[];
  bpmProcessId?: string;
  subProcessName?: string;
  standalone?: boolean;
  scheduleId?: string; // New: link to task schedule
}

export function CSATabContent({ 
  noGL: propNoGL, 
  controls: propControls = [], 
  initialSamples = [],
  bpmProcessId,
  subProcessName,
  standalone = false,
  scheduleId
}: CSATabContentProps) {
  const { t } = useTranslation(['bpm', 'common', 'csa_hub']);
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadRow, setActiveUploadRow] = useState<{ sIdx: number, cId: string } | null>(null);
  
  const noGL = propNoGL || searchParams.get('noGL') || "";
  const [view, setView] = useState<'list' | 'form'>('list');
  const [activeCsaId, setActiveCsaId] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [printLayout, setPrintLayout] = useState<'detailed' | 'summary' | null>(null);
  
  // Ref to track if user has explicitly closed the form/detail view
  const manualViewOverride = useRef<'list' | 'form' | null>(null);

  // 1. Queries
  const { data: diagram } = useQuery({
    queryKey: ['bpm-diagrams', 'by-gl', noGL, subProcessName],
    queryFn: () => api<any>(`/api/bpm-diagrams/by-gl/${noGL}${subProcessName ? `?subProcess=${encodeURIComponent(subProcessName)}` : ''}`),
    enabled: !!noGL
  });

  const { data: bpmProcess } = useQuery({
    queryKey: ['bpm-processes', bpmProcessId],
    queryFn: () => api<BPMProcess>(`/api/bpm-processes?id=${bpmProcessId}`).then((res: any) => res.items.find((p: any) => p.id === bpmProcessId)),
    enabled: !!bpmProcessId
  });

  const { data: csaList, isLoading: isListLoading } = useQuery({
    queryKey: ['csa-list', bpmProcessId],
    queryFn: () => api<{ items: CSARecord[] }>(`/api/csa?bpmProcessId=${bpmProcessId}`),
    enabled: !!bpmProcessId && view === 'list'
  });

  // Query to find if there's an existing record for the current schedule
  const { data: linkedScheduleRecord, isLoading: isCheckingSchedule } = useQuery({
    queryKey: ['csa-record-by-schedule', scheduleId],
    queryFn: () => api<{ items: CSARecord[] }>(`/api/csa?scheduleId=${scheduleId}`).then(res => res.items[0]),
    enabled: !!scheduleId && !isInitialized && manualViewOverride.current !== 'list'
  });

  const { data: activeCsa } = useQuery({
    queryKey: ['csa-detail', activeCsaId],
    queryFn: () => api<CSARecord>(`/api/csa/${activeCsaId}`),
    enabled: !!activeCsaId
  });

  // 2. Form & Field Array
  const form = useForm<CSAFormValues>({
    resolver: zodResolver(csaFormSchema),
    defaultValues: {
      period: '2025-Q1',
      result: 'Effective',
      comments: '',
      testProcedure: '',
      archiveLocation: '',
      samplingMethodology: 'Attribute Sampling / Zero Tolerance Approach',
      documentList: 'Invoice, Evidence of Approval, GL Posting',
      isBpmConfirmed: false,
      samples: []
    }
  });

  const { fields, replace: replaceSamples } = useFieldArray({
    control: form.control,
    name: "samples"
  });

  // 3. Derived Data & Memos
  const bpmRiskControlPairs = useMemo(() => {
    if (!diagram?.nodes) return [];
    const pairs: { riskId: string; riskName: string; controlId: string; controlName: string; code: string }[] = [];
    
    diagram.nodes.forEach((node: any) => {
      const nodePairs = node.data?.regulatoryPairs || 
                       (node.data?.regulatoryData ? [node.data.regulatoryData] : []);
      
      if ((node.type === 'activity' || node.type === 'automated-activity') && nodePairs.length > 0) {
        nodePairs.forEach((reg: any) => {
          if (reg.riskId && reg.controlId) {
            pairs.push({
              riskId: reg.riskId,
              riskName: reg.riskDescription || "N/A",
              controlId: reg.controlId,
              controlName: reg.controlDescription || node.data.label || "N/A",
              code: reg.controlId
            });
          }
        });
      }
    });
    return pairs;
  }, [diagram]);

  const activeControls = useMemo(() => {
    if (bpmRiskControlPairs.length > 0) {
      const seen = new Set();
      return bpmRiskControlPairs.filter(p => {
        const isNew = !seen.has(p.controlId);
        seen.add(p.controlId);
        return isNew;
      }).map(p => ({ id: p.controlId, name: p.controlName, code: p.code, description: p.riskName }));
    }
    return propControls;
  }, [bpmRiskControlPairs, propControls]);

  const watchSamples = form.watch('samples');

  const allPoints = useMemo(() => {
    return watchSamples.flatMap((s, sIdx) => 
      Object.entries(s.controlResults).map(([cId, res]) => ({
        sIdx,
        cId,
        sampleRef: s.sampleRef,
        glRowId: s.glRowId,
        ...res
      }))
    );
  }, [watchSamples]);

  const previewRecord = useMemo(() => {
    const values = form.getValues();
    return {
      ...activeCsa,
      ...values,
      id: activeCsaId || "PREVIEW-DRAFT",
      assessmentDate: activeCsa?.assessmentDate || Date.now(),
      assessedBy: activeCsa?.assessedBy || "Current User"
    } as any;
  }, [activeCsa, activeCsaId, watchSamples, form]); // eslint-disable-line react-hooks/exhaustive-deps

  const anyPointFailed = allPoints.some(p => !p.implemented);

  // 4. Effects
  // Context Isolation: Reset internal states when the process or schedule changes
  useEffect(() => {
    setIsInitialized(false);
    setActiveCsaId(null);
    setView('list');
    form.reset();
    manualViewOverride.current = null;
  }, [bpmProcessId, scheduleId, form]);

  // Smart Entry Logic
  useEffect(() => {
    // RESET initialized state if new samples arrive from parent hub
    if (initialSamples.length > 0 && !isInitialized && view === 'list') {
      // This is fresh data from Sampling tab, let's allow initialization to run
      manualViewOverride.current = null;
    }
  }, [initialSamples.length, isInitialized, view]);

  useEffect(() => {
    if (isInitialized || manualViewOverride.current === 'list') return;

    // SCENARIO 1: Coming from Todo List (scheduleId provided)
    if (scheduleId) {
      if (isCheckingSchedule) return; // Wait for direct record check

      if (linkedScheduleRecord) {
        // Record exists! Set it and go to form
        setActiveCsaId(linkedScheduleRecord.id);
        setView('form');
        setIsInitialized(true);
      } else if (initialSamples.length > 0) {
        // No record yet, but we have samples. Start new assessment.
        const newSamples = initialSamples.map(s => {
          const controlResults: Record<string, any> = {};
          if (bpmRiskControlPairs.length > 0) {
            bpmRiskControlPairs.forEach(pair => {
              controlResults[pair.controlId] = {
                implemented: false,
                riskId: pair.riskId,
                riskName: pair.riskName,
                controlName: pair.controlName,
                evidenceUrl: '',
                comment: ''
              };
            });
          } else {
            activeControls.forEach(ctrl => {
              controlResults[ctrl.id] = { implemented: false };
            });
          }

          let sampleRef = "";
          if ("glDesc" in s) sampleRef = s.glDesc;
          else if ("description" in s) sampleRef = (s as any).description || "N/A";

          return { sampleRef, glRowId: (s as any).id, controlResults };
        });
        replaceSamples(newSamples);
        setIsInitialized(true);
        setView('form');
      }
    } 
    // SCENARIO 2: Just picked samples in Hub (No schedule, but fresh samples)
    else if (initialSamples.length > 0 && view !== 'form') {
      const newSamples = initialSamples.map(s => {
        const controlResults: Record<string, any> = {};
        if (bpmRiskControlPairs.length > 0) {
          bpmRiskControlPairs.forEach(pair => {
            controlResults[pair.controlId] = {
              implemented: false,
              riskId: pair.riskId,
              riskName: pair.riskName,
              controlName: pair.controlName,
              evidenceUrl: '',
              comment: ''
            };
          });
        } else {
          activeControls.forEach(ctrl => {
            controlResults[ctrl.id] = { implemented: false };
          });
        }

        let sampleRef = "";
        if ("glDesc" in s) sampleRef = s.glDesc;
        else if ("description" in s) sampleRef = (s as any).description || "N/A";

        return { sampleRef, glRowId: (s as any).id, controlResults };
      });
      replaceSamples(newSamples);
      setIsInitialized(true);
      setView('form');
    }
  }, [scheduleId, linkedScheduleRecord, isCheckingSchedule, initialSamples, bpmRiskControlPairs, activeControls, replaceSamples, isInitialized, view]);

  useEffect(() => {
    if (bpmProcess?.standardTestProcedure && !activeCsaId && !form.getValues('testProcedure')) {
      form.setValue('testProcedure', bpmProcess.standardTestProcedure);
    }
  }, [bpmProcess, activeCsaId, form]);

  useEffect(() => {
    // Only load record data if we have an ID AND we are NOT explicitly in list view
    if (activeCsa && activeCsaId && view !== 'list' && manualViewOverride.current !== 'list') {
      form.reset({
        period: activeCsa.period,
        result: activeCsa.result,
        comments: activeCsa.comments || '',
        testProcedure: (activeCsa as any).testProcedure || '',
        archiveLocation: (activeCsa as any).archiveLocation || '',
        samplingMethodology: (activeCsa as any).samplingMethodology || '',
        documentList: (activeCsa as any).documentList || '',
        isBpmConfirmed: true,
        samples: activeCsa.samples.map(s => {
          const transformedResults: Record<string, any> = {};
          if (s.controlResults) {
            Object.entries(s.controlResults).forEach(([id, val]) => {
              transformedResults[id] = typeof val === 'boolean' ? { implemented: val } : val;
            });
          }
          return {
            sampleRef: s.sampleRef,
            glRowId: s.glRowId,
            controlResults: transformedResults
          };
        })
      });
      setView('form');
    }
  }, [activeCsa, activeCsaId, view, form]);

  useEffect(() => {
    if (anyPointFailed && form.getValues('result') === 'Effective') {
      form.setValue('result', 'Ineffective');
      toast.warning("Zero Tolerance: Status diset ke Ineffective karena ada kontrol yang gagal.");
    }
  }, [anyPointFailed, form]);

  // Sync: Ensure activeCsaId is null when in list view to prevent stuck details
  useEffect(() => {
    if (view === 'list') {
      setActiveCsaId(null);
      setIsInitialized(true);
      manualViewOverride.current = 'list';
    }
  }, [view]);

  // 5. Hooks (Safety)
  const isDirty = form.formState.isDirty && view === 'form' && !activeCsaId;
  const blocker = useUnsavedChanges(isDirty);

  // 6. Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api<CSARecord>('/api/csa', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (newRecord, variables) => {
      toast.success(variables.isDraft ? "Draft saved successfully" : "CSA Sign-off successful");
      queryClient.invalidateQueries({ queryKey: ['csa-list'] });
      queryClient.invalidateQueries({ queryKey: ['csa-schedules'] });
      
      if (!variables.isDraft) {
        setView('list');
        setActiveCsaId(null);
        setIsInitialized(true);
        manualViewOverride.current = 'list';
      } else {
        setActiveCsaId(newRecord.id);
        form.reset(form.getValues(), { keepDirty: false });
      }
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ sIdx, cId, file }: { sIdx: number; cId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      return api<{ url: string }>('/api/upload', { method: 'POST', body: formData });
    },
    onSuccess: (data, variables) => {
      form.setValue(`samples.${variables.sIdx}.controlResults.${variables.cId}.evidenceUrl`, data.url, { shouldDirty: true });
      toast.success("Bukti berhasil diunggah");
      setActiveUploadRow(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/csa/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success("Assessment deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['csa-list'] });
      queryClient.invalidateQueries({ queryKey: ['csa-schedules'] });
    }
  });

  // 7. Event Handlers
  const handleDelete = (id: string) => {
    if (confirm("Hapus asesmen ini secara permanen? Data sampel dan bukti juga akan terhapus.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFileUploadTrigger = (sIdx: number, cId: string) => {
    setActiveUploadRow({ sIdx, cId });
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeUploadRow) {
      uploadMutation.mutate({ ...activeUploadRow, file });
    }
  };

  const onSaveDraft = async () => {
    const values = form.getValues();
    createMutation.mutate({
      ...values,
      id: activeCsaId || undefined,
      isDraft: true,
      scheduleId,
      bpmProcessId,
      testProcedure: values.testProcedure,
      archiveLocation: values.archiveLocation,
      organizationId: (initialSamples[0] as any)?.organizationId || searchParams.get('orgId'),
    });
  };

  const onSubmit = async (values: CSAFormValues) => {
    const flatResults = values.samples.flatMap(s => Object.values(s.controlResults));
    const anySampleFailed = flatResults.some(r => !r.implemented);
    const anyMissingEvidence = flatResults.some(r => r.implemented && !r.evidenceUrl);

    if (anyMissingEvidence && values.result === 'Effective') {
      toast.error("Setiap kontrol yang 'Pass' wajib melampirkan bukti (evidence) sebelum sign-off.");
      return;
    }

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
      id: activeCsaId || undefined,
      result: realResult,
      isDraft: false,
      scheduleId,
      bpmProcessId,
      testProcedure: values.testProcedure,
      archiveLocation: values.archiveLocation,
      organizationId: (initialSamples[0] as any)?.organizationId || searchParams.get('orgId'),
    });
  };

  const handlePrint = (layout: 'detailed' | 'summary') => {
    setPrintLayout(layout);
    setTimeout(() => {
      window.print();
      setPrintLayout(null);
    }, 500);
  };

  // Atomic Back to List Handler
  const handleBackToList = () => {
    manualViewOverride.current = 'list';
    setActiveCsaId(null);
    setView('list');
    form.reset();
    setIsInitialized(true);
  };

  const isReadOnly = !!activeCsaId && !isDirty;

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @media screen {
          .printable-area { display: none; }
        }
        @media print {
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            display: block !important;
          }
          .print-hidden { display: none !important; }
        }
      `}} />
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileChange} 
        className="hidden" 
        accept=".pdf,.png,.jpg,.jpeg,.xlsx" 
      />

      <div className="printable-area">
        {printLayout === 'detailed' && (
          <Appendix7aDetailed 
            record={previewRecord} 
            bpmProcessName={subProcessName || bpmProcess?.name || "N/A"} 
            noGL={noGL} 
          />
        )}
        {printLayout === 'summary' && (
          <Appendix7aSummary 
            record={previewRecord} 
            bpmProcessName={subProcessName || bpmProcess?.name || "N/A"} 
            noGL={noGL} 
          />
        )}
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1 print-hidden">
        {/* Main Content - Left (Order 1) */}
        <ResizablePanel defaultSize={70} minSize={30}>
          <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto bg-white p-6 relative">
              {view === 'list' ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Assessment History</h3>
                    <Button 
                      onClick={() => { 
                        manualViewOverride.current = 'form';
                        setIsInitialized(true); 
                        setView('form'); 
                        setActiveCsaId(null);

                        // If we have initialSamples waiting from Sampling tab, use them!
                        const prepSamples = initialSamples.map(s => {
                          const controlResults: Record<string, any> = {};
                          if (bpmRiskControlPairs.length > 0) {
                            bpmRiskControlPairs.forEach(pair => {
                              controlResults[pair.controlId] = {
                                implemented: false,
                                riskId: pair.riskId,
                                riskName: pair.riskName,
                                controlName: pair.controlName,
                                evidenceUrl: '',
                                comment: ''
                              };
                            });
                          } else {
                            activeControls.forEach(ctrl => {
                              controlResults[ctrl.id] = { implemented: false };
                            });
                          }

                          let sampleRef = "";
                          if ("glDesc" in s) sampleRef = s.glDesc;
                          else if ("description" in s) sampleRef = (s as any).description || "N/A";

                          return { sampleRef, glRowId: (s as any).id, controlResults };
                        });

                        form.reset({
                           period: '2025-Q1',
                           result: 'Effective',
                           comments: '',
                           testProcedure: bpmProcess?.standardTestProcedure || '',
                           archiveLocation: '',
                           isBpmConfirmed: false,
                           samples: prepSamples
                        });
                      }} 
                      className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs gap-2"
                    >
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
                            <div className="flex justify-end gap-1">
                              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => { manualViewOverride.current = 'form'; setActiveCsaId(item.id); setView('form'); }}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="icon" className="h-7 w-7 text-indigo-600 border-indigo-200">
                                    <Printer className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="text-[10px] font-bold gap-2 cursor-pointer" onClick={() => { setActiveCsaId(item.id); handlePrint('detailed'); }}>
                                    <FileText className="h-3.5 w-3.5" /> Export Appendix 7a (Detailed)
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-[10px] font-bold gap-2 cursor-pointer" onClick={() => { setActiveCsaId(item.id); handlePrint('summary'); }}>
                                    <LayoutDashboard className="h-3.5 w-3.5" /> Export Appendix 7a (Summary)
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-slate-300 hover:text-red-600 hover:bg-red-50" 
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                        <FormField control={form.control} name="period" render={({ field: f }) => (
                          <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Periode</FormLabel><FormControl><Input {...f} disabled={isReadOnly} className="h-9 font-bold text-xs" /></FormControl></FormItem>
                        )} />
                        <div className="col-span-2">
                          <FormField control={form.control} name="result" render={({ field: f }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-[10px] font-black uppercase text-slate-400">Hasil Akhir (SK-5)</FormLabel>
                              <FormControl>
                                <RadioGroup onValueChange={f.onChange} value={f.value} className="flex gap-4" disabled={isReadOnly}>
                                  {['Effective', 'Ineffective', 'No Transaction'].map(res => (
                                    <div key={res} className="flex items-center space-x-2">
                                      <RadioGroupItem value={res} id={res} disabled={res === 'Effective' && anyPointFailed} />
                                      <label htmlFor={res} className={cn("text-xs font-bold", res === 'Effective' ? "text-green-700" : "text-red-700")}>{res}</label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                            </FormItem>
                          )} />
                        </div>
                      </div>

                      <FormField control={form.control} name="isBpmConfirmed" render={({ field: f }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                          <FormControl>
                            <Checkbox checked={f.value} onCheckedChange={f.onChange} disabled={isReadOnly} />
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50/50 border border-slate-200 rounded-xl">
                        <FormField control={form.control} name="testProcedure" render={({ field: f }) => (
                          <FormItem className="col-span-1">
                            <FormLabel className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                               <FileText className="h-3 w-3" /> {t('csa_hub:appendix7a.testProcedure')}
                            </FormLabel>
                            <FormControl><Textarea {...f} disabled={isReadOnly} className="min-h-[100px] text-xs bg-white" placeholder={t('csa_hub:appendix7a.procedurePlaceholder')} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="archiveLocation" render={({ field: f }) => (
                          <FormItem className="col-span-1">
                            <FormLabel className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                               <MapPin className="h-3 w-3" /> {t('csa_hub:appendix7a.archiveLocation')}
                            </FormLabel>
                            <FormControl><Input {...f} disabled={isReadOnly} className="h-10 text-xs bg-white" placeholder={t('csa_hub:appendix7a.locationPlaceholder')} /></FormControl>
                            <FormMessage />
                            <p className="text-[9px] text-slate-400 mt-2 italic">{t('csa_hub:appendix7a.archiveNote')}</p>
                          </FormItem>
                        )} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase text-slate-700 flex items-center gap-2">
                          <LayoutDashboard className="h-3.5 w-3.5" /> 1. Summary Status Matrix
                        </h4>
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[10px] font-bold">
                          Quick Pass/Fail Toggle
                        </Badge>
                      </div>
                      <div className="border rounded-xl overflow-x-auto shadow-sm">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow className="divide-x">
                              <TableHead className="w-10 text-[9px] font-bold">#</TableHead>
                              <TableHead className="text-[9px] font-bold min-w-[200px]">Sample Reference</TableHead>
                              <TooltipProvider>
                                {activeControls.map(ctrl => (
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
                                {activeControls.map(ctrl => (
                                  <TableCell key={ctrl.id} className="text-center p-0">
                                    <FormField control={form.control} name={`samples.${sIdx}.controlResults.${ctrl.id}.implemented`} render={({ field: f }) => (
                                      <div className="flex items-center justify-center h-full min-h-[40px]">
                                        <Checkbox 
                                          checked={f.value} 
                                          onCheckedChange={f.onChange} 
                                          disabled={isReadOnly} 
                                          className={cn("h-5 w-5", f.value ? "text-green-600 border-green-600" : "text-slate-300")}
                                        />
                                      </div>
                                    )} />
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase text-slate-700 flex items-center gap-2">
                          <Database className="h-3.5 w-3.5" /> 2. Detailed Verification & Evidence
                        </h4>
                        <div className="flex gap-2">
                           <Badge className="bg-emerald-600 text-[9px] font-black uppercase tracking-wider">{allPoints.filter(p => p.implemented).length} Passed</Badge>
                           <Badge className="bg-red-600 text-[9px] font-black uppercase tracking-wider">{allPoints.filter(p => !p.implemented).length} Deficiency</Badge>
                        </div>
                      </div>
                      
                      <div className="border rounded-xl overflow-hidden shadow-md">
                        <Table>
                          <TableHeader className="bg-slate-900 text-white">
                            <TableRow className="divide-x divide-white/10 hover:bg-transparent">
                              <TableHead className="text-[10px] font-black text-white py-4 px-4 min-w-[200px]">Transaction Detail</TableHead>
                              <TableHead className="text-[10px] font-black text-white">Risk Name</TableHead>
                              <TableHead className="text-[10px] font-black text-white">Control Name</TableHead>
                              <TableHead className="text-[10px] font-black text-white text-center w-32">Evidence</TableHead>
                              <TableHead className="text-[10px] font-black text-white min-w-[200px]">Keterangan</TableHead>
                              <TableHead className="text-[10px] font-black text-white text-center w-24">Pass?</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allPoints.map((point, pIdx) => (
                              <TableRow key={`${point.glRowId}-${point.cId}`} className={cn(
                                "divide-x border-b transition-colors",
                                point.implemented ? "bg-white" : "bg-red-50/50"
                              )}>
                                <TableCell className="py-3 px-4">
                                  <div className="font-bold text-xs text-slate-900">{point.sampleRef}</div>
                                  <code className="text-[9px] text-slate-400">ID: {point.glRowId?.substring(0,8)}</code>
                                </TableCell>
                                <TableCell className="text-[11px] font-medium text-slate-600 italic">
                                  {point.riskName}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-bold text-xs text-slate-800">{point.controlName}</span>
                                    <Badge variant="outline" className="w-fit text-[9px] h-4 font-mono">{point.cId}</Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                   <div className="flex flex-col items-center gap-1">
                                      <Button 
                                        type="button"
                                        variant={point.evidenceUrl ? "default" : "outline"} 
                                        size="icon" 
                                        className={cn("h-8 w-8 rounded-lg", point.evidenceUrl ? "bg-indigo-600" : "border-slate-200")}
                                        onClick={() => !isReadOnly && handleFileUploadTrigger(point.sIdx, point.cId)}
                                      >
                                        {uploadMutation.isPending && activeUploadRow?.sIdx === point.sIdx && activeUploadRow?.cId === point.cId ? (
                                          <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : point.evidenceUrl ? (
                                          <Check className="h-4 w-4" />
                                        ) : (
                                          <UploadCloud className="h-4 w-4" />
                                        )}
                                      </Button>
                                      {point.evidenceUrl && <span className="text-[8px] text-emerald-600 font-bold uppercase">Attached</span>}
                                   </div>
                                </TableCell>
                                <TableCell>
                                  <FormField control={form.control} name={`samples.${point.sIdx}.controlResults.${point.cId}.comment`} render={({ field: f }) => (
                                    <Input 
                                      {...f} 
                                      disabled={isReadOnly} 
                                      className="h-8 text-xs border-transparent hover:border-slate-200 focus:border-indigo-400 bg-transparent transition-all"
                                      placeholder="Tambahkan catatan..."
                                    />
                                  )} />
                                </TableCell>
                                <TableCell className="text-center">
                                  <FormField control={form.control} name={`samples.${point.sIdx}.controlResults.${point.cId}.implemented`} render={({ field: f }) => (
                                    <div className="flex items-center justify-center">
                                      <Checkbox 
                                        checked={f.value} 
                                        onCheckedChange={f.onChange} 
                                        disabled={isReadOnly} 
                                        className={cn("h-6 w-6", f.value ? "text-green-600 border-green-600" : "text-red-400 border-red-200")}
                                      />
                                    </div>
                                  )} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="flex justify-between items-center bg-slate-100 p-5 rounded-xl border border-slate-200 shadow-inner">
                         <div className="flex gap-10">
                           <div className="text-center border-r pr-10 border-slate-300">
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Verification Points</p>
                             <p className="text-2xl font-black text-slate-700">{allPoints.length}</p>
                           </div>
                           <div className="text-center">
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Progress</p>
                             <p className="text-2xl font-black text-indigo-600">
                                {allPoints.filter(p => p.implemented || p.comment || p.evidenceUrl).length} / {allPoints.length}
                             </p>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status Dokumentasi</p>
                           {(() => {
                             const anyPassWithoutEvidence = allPoints.some(p => p.implemented && !p.evidenceUrl);
                             const nothingDone = allPoints.every(p => !p.implemented && !p.evidenceUrl && !p.comment);
                             if (nothingDone) return <p className="text-xl font-black uppercase italic text-slate-400">Belum Dimulai</p>;
                             if (anyPassWithoutEvidence) return <p className="text-xl font-black uppercase italic text-rose-500 animate-pulse">Butuh Evidence</p>;
                             return <p className="text-xl font-black uppercase italic text-emerald-600">Siap Sign-off</p>;
                           })()}
                         </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t space-y-6">
                        <FormField control={form.control} name="comments" render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase text-slate-400">Management Rationale / Catatan Temuan</FormLabel>
                            <FormControl><Textarea {...f} disabled={isReadOnly} className="min-h-[120px] text-sm shadow-sm" placeholder="Wajib diisi jika status INEFFECTIVE..." /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <div className="flex justify-end gap-3">
                          <Button 
                            variant="outline" 
                            type="button"
                            onClick={handleBackToList} 
                            className="px-8 font-bold"
                          >
                             {isReadOnly ? <ChevronLeft className="h-4 w-4 mr-2" /> : null}
                             {isReadOnly ? "Kembali ke Daftar" : "Batal"}
                          </Button>

                          {(isReadOnly || watchSamples.length > 0) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button type="button" className="bg-slate-800 hover:bg-slate-900 text-white font-black px-8 h-12 gap-2 shadow-xl uppercase tracking-widest">
                                  <Printer className="h-5 w-5" /> {t('csa_hub:actions.exportApp7a')} <ChevronDown className="h-4 w-4 ml-1" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem className="text-xs font-bold gap-2 py-3 cursor-pointer" onClick={() => handlePrint('detailed')}>
                                  <FileText className="h-4 w-4 text-indigo-600" /> {t('csa_hub:actions.layoutDetailed')}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold gap-2 py-3 cursor-pointer" onClick={() => handlePrint('summary')}>
                                  <LayoutDashboard className="h-4 w-4 text-indigo-600" /> {t('csa_hub:actions.layoutSummary')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}

                          {!isReadOnly && (
                            <>
                              <Button 
                                type="button"
                                disabled={createMutation.isPending || isAuthenticating} 
                                onClick={onSaveDraft}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-black px-8 h-12 gap-2 shadow-xl shadow-amber-100 uppercase tracking-widest"
                              >
                                 {createMutation.isPending && createMutation.variables?.isDraft ? <RefreshCw className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                                 {t('csa_hub:actions.saveDraft')}
                              </Button>
                              <Button disabled={createMutation.isPending || isAuthenticating} type="submit" className="bg-indigo-600 hover:bg-indigo-700 font-black px-12 h-12 gap-2 shadow-xl shadow-indigo-100 uppercase tracking-widest">
                                 {isAuthenticating ? <RefreshCw className="h-5 w-5 animate-spin" /> : <UserCheck className="h-5 w-5" />}
                                 {t('csa_hub:actions.save')}
                              </Button>
                            </>
                          )}
                        </div>
                    </div>
                  </form>
                </Form>
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Diagram - Right (Order 2) */}
        <ResizablePanel defaultSize={30} minSize={20}>
          <div className="h-full relative bg-slate-50 border-l overflow-hidden">
            {diagram ? (
              <ReactFlow nodes={diagram.nodes} edges={diagram.edges} nodeTypes={nodeTypes} fitView>
                <Background color="#cbd5e1" gap={16} />
                <Controls />
              </ReactFlow>
            ) : <div className="h-full flex flex-col items-center justify-center opacity-20"><LayoutDashboard className="h-12 w-12 mb-2" /><p className="text-xs font-bold uppercase">No Diagram Linked</p></div>}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      <UnsavedChangesDialog blocker={blocker} />
    </div>
  );
}
