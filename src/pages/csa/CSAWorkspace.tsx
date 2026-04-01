import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { getGroupMultiplier, QualitativeScopingReason } from '@/lib/compliance-utils';
import type { Control, CSARecord } from '@shared/types';
import { toast } from 'sonner';
import { 
  UploadCloud, File as FileIcon, X, AlertTriangle, CheckCircle2, UserCheck, 
  Search, Workflow, PlusCircle, FileDown, ShieldCheck, History, Eye, ArrowRight, Info 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ControlEditor } from '@/components/rcm/ControlEditor';
import { RiskLibraryLookup } from '@/components/rcm/RiskLibraryLookup';
const BPMEditor = React.lazy(() => import('@/components/rcm/BPMEditor').then(m => ({ default: m.BPMEditor })));
import { motion, AnimatePresence } from 'framer-motion';

const csaSchema = z.object({
  result: z.enum(['High', 'Medium', 'Low']),
  comments: z.string().optional(),
  itacScenario: z.string().optional(),
  itacMethod: z.string().optional(),
  itacSampleInfo: z.string().optional(),
  itacExpectedResult: z.string().optional(),
  itacActualResult: z.string().optional(),
});

const reviewSchema = z.object({
  status: z.enum(['Validated', 'Rejected']),
  comments: z.string().min(1, "Review comments are required"),
});

function ControlAssessmentCard({ control, existingCsa, role, onReview }: { control: Control, existingCsa?: CSARecord, role: string, onReview?: (data: any) => void }) {
  const queryClient = useQueryClient();
  const [evidenceFile, setEvidenceFile] = React.useState<File | null>(null);
  const [l2EvidenceFile, setL2EvidenceFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);

  const form = useForm<z.infer<typeof csaSchema>>({
    resolver: zodResolver(csaSchema),
    defaultValues: { 
      result: existingCsa?.result || 'Low', 
      comments: existingCsa?.comments || '',
      itacScenario: existingCsa?.itacScenario || '',
      itacMethod: existingCsa?.itacMethod || '',
      itacSampleInfo: existingCsa?.itacSampleInfo || '',
      itacExpectedResult: existingCsa?.itacExpectedResult || '',
      itacActualResult: existingCsa?.itacActualResult || '',
    },
  });

  const reviewForm = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { status: 'Validated', comments: '' }
  });

  const onL2Drop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setL2EvidenceFile(acceptedFiles[0]);
      toast.success(`Bukti Test of One (${acceptedFiles[0].name}) terlampir.`);
    }
  }, []);

  const { getRootProps: getL2Root, getInputProps: getL2Input, isDragActive: isL2Active } = useDropzone({ 
    onDrop: onL2Drop, 
    multiple: false,
    disabled: !onReview 
  });

  const mutation = useMutation({
    mutationFn: (data: Omit<CSARecord, 'id' | 'assessmentDate' | 'assessedBy'>) => api('/api/csa', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (data: CSARecord) => {
      toast.success(`Assessment for ${control.name} submitted.`);
      if (data.result === 'High' || data.result === 'Medium') {
        queryClient.invalidateQueries({ queryKey: ['deficiencies'] });
      }
      queryClient.invalidateQueries({ queryKey: ['csa'] });
      form.reset();
      setEvidenceFile(null);
      setPreview(null);
    },
    onError: (error) => {
      toast.error(`Submission failed: ${error.message}`);
    },
  });

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setEvidenceFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false, accept: { 'image/*': [], 'application/pdf': [] } });

  function onSubmit(values: z.infer<typeof csaSchema>) {
    mutation.mutate({
      controlId: control.id,
      ...values,
      evidenceUrl: evidenceFile ? `mock-uploads/${evidenceFile.name}` : undefined,
    });
  }

  const isLine2 = role === 'Line 2';
  const isReviewed = existingCsa?.line2Status === 'Validated' || existingCsa?.line2Status === 'Rejected';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{control.name}</CardTitle>
            <CardDescription className="line-clamp-2">{control.description}</CardDescription>
          </div>
          <div className="flex flex-col gap-1 items-end">
            {control.isFraudRisk && (
              <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50 text-[10px]">FRAUD RISK</Badge>
            )}
            {existingCsa && (
              <Badge 
                variant={existingCsa.result === 'Low' ? 'default' : existingCsa.result === 'Medium' ? 'secondary' : 'destructive'} 
                className={cn(
                  "text-[10px]",
                  existingCsa.result === 'Low' && "bg-green-600 hover:bg-green-700",
                  existingCsa.result === 'Medium' && "bg-yellow-500 text-yellow-950 hover:bg-yellow-600"
                )}
              >
                Line 1: {existingCsa.result}
              </Badge>
            )}
            {isReviewed && (
              <Badge variant="outline" className="border-green-600 text-green-700 bg-green-50 text-[10px] gap-1">
                <UserCheck className="h-3 w-3" /> L2 Reviewed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLine2 && existingCsa ? (
          <div className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-lg border text-sm">
              <p className="font-semibold text-muted-foreground mb-1">Line 1 Assessment:</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-bold">Result:</span> {existingCsa.result}
                </div>
                <div>
                  <span className="font-bold">Evidence:</span> {existingCsa.evidenceUrl || 'None'}
                </div>
                {existingCsa.itacScenario && (
                  <div className="col-span-2 border-t pt-2 mt-2 space-y-1">
                    <p className="text-[10px] font-bold text-blue-800 uppercase">ITAC Details (Lampiran 7)</p>
                    <p><strong>Scenario:</strong> {existingCsa.itacScenario}</p>
                    <p><strong>Method:</strong> {existingCsa.itacMethod}</p>
                    <p><strong>Sample Info:</strong> {existingCsa.itacSampleInfo}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="font-bold">Comments:</span> {existingCsa.comments}
                </div>
              </div>
            </div>

            {!isReviewed ? (
              <div className="border-t pt-4">
                <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-blue-600" /> Line 2 Validation (Test of One)
                </h4>
                <div className="space-y-3">
                  {control.nature === "ITDM - EUC" && (
                    <div className="p-3 bg-blue-50/50 rounded-md border border-blue-100 space-y-2 mb-4">
                      <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest">EUC Technical Verification (Table 14)</p>
                      <div className="grid grid-cols-1 gap-1">
                        {["Version Control", "Access Control", "Change Control", "Data Integrity", "Availability Control"].map(attr => (
                          <label key={attr} className="flex items-center gap-2 text-[11px] cursor-pointer">
                            <input type="checkbox" className="rounded border-blue-300" defaultChecked /> {attr}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {control.nature === "ITDM - IPE" && (
                    <div className="p-3 bg-purple-50/50 rounded-md border border-purple-100 space-y-2 mb-4">
                      <p className="text-[10px] font-bold text-purple-800 uppercase tracking-widest">IPE Reliability Check (Table 20)</p>
                      <div className="grid grid-cols-1 gap-1">
                        <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                          <input type="checkbox" className="rounded border-purple-300" defaultChecked /> Parameter Extraction Verification
                        </label>
                        {control.ipeType === "Query" && (
                          <label className="flex items-center gap-2 text-[11px] cursor-pointer font-bold text-purple-700">
                            <input type="checkbox" className="rounded border-purple-300" /> Logic/SQL Script Review (Mandatory for Query)
                          </label>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="l2-status">Validation Status</Label>
                      <select 
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        {...reviewForm.register('status')}
                      >
                        <option value="Validated">Validated (Effective)</option>
                        <option value="Rejected">Rejected (Ineffective)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label>Walkthrough Evidence (Mandatory)</Label>
                      <div {...getL2Root()} className={`h-9 flex items-center justify-center rounded-md border-2 border-dashed text-[10px] cursor-pointer hover:border-primary ${isL2Active ? 'border-primary bg-accent' : ''}`}>
                        <input {...getL2Input()} />
                        {l2EvidenceFile ? (
                          <span className="text-blue-600 font-bold flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> {l2EvidenceFile.name}</span>
                        ) : (
                          <span className="text-muted-foreground">Click to upload Test of One doc</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="l2-comments">Validation Notes</Label>
                    <Textarea 
                      placeholder="Enter validation notes..." 
                      className="h-20" 
                      {...reviewForm.register('comments')}
                    />
                  </div>
                  <Button 
                    size="sm" 
                    onClick={reviewForm.handleSubmit((data) => onReview?.({ ...data, csaId: existingCsa.id, testOfOneEvidence: l2EvidenceFile?.name }))}
                  >
                    Submit Validation
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-green-50/50 p-3 rounded border border-green-100 text-sm">
                <p className="font-bold text-green-800">Validated by Line 2</p>
                <p className="text-green-700">{existingCsa.line2Comments}</p>
                {existingCsa.line2ValidatedDate && (
                   <p className="text-[10px] text-muted-foreground mt-1">Date: {new Date(existingCsa.line2ValidatedDate).toLocaleDateString()}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <fieldset disabled={!!existingCsa || isLine2} className="space-y-6">
                {(control.nature === 'Automated' || control.nature.startsWith('ITDM')) && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-4">
                    <p className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3" /> ITAC/ITDM Mandatory Fields (Lampiran 7 - Hal 91)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="itacScenario" render={({ field }) => (
                        <FormItem><FormLabel className="text-[10px] uppercase font-bold">Skenario ITAC</FormLabel><FormControl><Input {...field} className="h-8 text-xs bg-white" placeholder="e.g. Validasi limit transaksi" /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="itacMethod" render={({ field }) => (
                        <FormItem><FormLabel className="text-[10px] uppercase font-bold">Metode Pengujian</FormLabel><FormControl><Input {...field} className="h-8 text-xs bg-white" placeholder="e.g. Test of One / Reperformance" /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="itacSampleInfo" render={({ field }) => (
                        <FormItem className="col-span-2"><FormLabel className="text-[10px] uppercase font-bold">Informasi Sampel</FormLabel><FormControl><Input {...field} className="h-8 text-xs bg-white" placeholder="e.g. Bukti log sistem tanggal 12/01/2024" /></FormControl></FormItem>
                      )} />
                    </div>
                  </div>
                )}
                <FormField control={form.control} name="result" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="font-semibold text-sm">Is the control operating effectively?</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-wrap gap-4">
                        <FormItem className={cn(
                          "flex items-center space-x-2 border rounded-lg px-4 py-2 cursor-pointer transition-all",
                          field.value === 'High' ? "bg-red-500 text-white border-red-600" : "bg-red-50 text-red-800 border-red-100 hover:bg-red-100"
                        )}>
                          <FormControl><RadioGroupItem value="High" className={field.value === 'High' ? "border-white" : ""} /></FormControl>
                          <FormLabel className="font-bold cursor-pointer">High</FormLabel>
                        </FormItem>
                        
                        <FormItem className={cn(
                          "flex items-center space-x-2 border rounded-lg px-4 py-2 cursor-pointer transition-all",
                          field.value === 'Medium' ? "bg-yellow-500 text-white border-yellow-600" : "bg-yellow-50 text-yellow-800 border-yellow-100 hover:bg-yellow-100"
                        )}>
                          <FormControl><RadioGroupItem value="Medium" className={field.value === 'Medium' ? "border-white" : ""} /></FormControl>
                          <FormLabel className="font-bold cursor-pointer">Medium</FormLabel>
                        </FormItem>

                        <FormItem className={cn(
                          "flex items-center space-x-2 border rounded-lg px-4 py-2 cursor-pointer transition-all",
                          field.value === 'Low' ? "bg-green-500 text-white border-green-600" : "bg-green-50 text-green-800 border-green-100 hover:bg-green-100"
                        )}>
                          <FormControl><RadioGroupItem value="Low" className={field.value === 'Low' ? "border-white" : ""} /></FormControl>
                          <FormLabel className="font-bold cursor-pointer">Low</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="comments" render={({ field }) => (
                  <FormItem><FormLabel className="font-semibold">Comments</FormLabel><FormControl><Textarea placeholder="Provide comments or context..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div>
                  <Label className="font-semibold">Evidence</Label>
                  {!evidenceFile && !existingCsa ? (
                    <div {...getRootProps()} className={`mt-2 flex justify-center rounded-md border-2 border-dashed border-input px-6 pt-5 pb-6 cursor-pointer hover:border-primary ${isDragActive ? 'border-primary bg-accent' : ''}`}>
                      <input {...getInputProps()} />
                      <div className="space-y-1 text-center"><UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" /><p className="text-sm text-muted-foreground">Drag & drop a file here, or click to select</p></div>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center justify-between rounded-md border border-input p-3">
                      <div className="flex items-center gap-2">
                        {preview && preview.startsWith('data:image') ? <img src={preview} alt="preview" className="h-10 w-10 rounded object-cover" /> : <FileIcon className="h-8 w-8 text-muted-foreground" />}
                        <span className="text-sm font-medium">{evidenceFile?.name || existingCsa?.evidenceUrl || "No file uploaded"}</span>
                      </div>
                      {!existingCsa && <Button variant="ghost" size="icon" onClick={() => { setEvidenceFile(null); setPreview(null); }}><X className="h-4 w-4" /></Button>}
                    </div>
                  )}
                </div>
              </fieldset>
              {!existingCsa && !isLine2 && <div className="flex justify-end"><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Submitting...' : 'Submit Assessment'}</Button></div>}
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}

interface RCMDiffViewerProps {
  current: any;
  proposed: any;
}

function RCMDiffViewer({ current, proposed }: RCMDiffViewerProps) {
  const fields = ['process', 'subProcess', 'riskDescription'];
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-[10px] font-bold uppercase text-slate-400 px-2">Current Version</div>
        <div className="text-[10px] font-bold uppercase text-slate-400 px-2">Proposed Changes</div>
      </div>
      <div className="space-y-2">
        {fields.map(field => {
          const isChanged = proposed[field] !== undefined && proposed[field] !== (current as any)[field];
          return (
            <div key={field} className={cn(
              "grid grid-cols-2 gap-4 p-2 rounded-md transition-colors",
              isChanged ? "bg-amber-50/50" : "bg-slate-50/30"
            )}>
              <div className="text-xs text-slate-600 line-clamp-2">{String((current as any)[field] || '-')}</div>
              <div className="flex items-start gap-2">
                {isChanged && <ArrowRight className="h-3 w-3 text-amber-500 mt-0.5" />}
                <div className={cn(
                  "text-xs font-medium",
                  isChanged ? "text-amber-700" : "text-slate-400"
                )}>
                  {isChanged ? String(proposed[field]) : "No change"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CSAWorkspace() {
  const [selectedControl, setSelectedControl] = React.useState<Control | null>(null);
  const [isEditorOpen, setEditorOpen] = React.useState(false);
  const [isAddProcessOpen, setAddProcessOpen] = React.useState(false);
  const [isBpmOpen, setBpmOpen] = React.useState(false);
  const [isCompareOpen, setCompareOpen] = React.useState(false);
  const [isRejectOpen, setRejectOpen] = React.useState(false);
  const [selectedRcm, setSelectedRcm] = React.useState<any | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [newRcmData, setNewRcmData] = React.useState({ process: '', subProcess: '', riskDescription: '' });

  const { data: rcmData, isLoading: rcmLoading } = useQuery({
    queryKey: ['rcm'],
    queryFn: () => api<{ items: any[] }>('/api/rcm'),
  });

  const { data: controlsData, isLoading: controlsLoading } = useQuery({
    queryKey: ['controls'],
    queryFn: () => api<{ items: Control[] }>('/api/controls'),
  });

  const { data: csaData, isLoading: csaLoading } = useQuery({
    queryKey: ['csa'],
    queryFn: () => api<{ items: CSARecord[] }>('/api/csa'),
  });

  const queryClient = useQueryClient();
  const mockRole = localStorage.getItem('mockRole') || 'Line 1';
  const mockUserId = 'u1';

  const validateMutation = useMutation({
    mutationFn: (rcmId: string) => api(`/api/rcm/${rcmId}/validate`, { method: 'POST' }),
    onSuccess: () => {
      toast.success('RCM design validated and activated!');
      queryClient.invalidateQueries({ queryKey: ['rcm'] });
    }
  });

  const approveChangeMutation = useMutation({
    mutationFn: (rcmId: string) => api(`/api/rcm/${rcmId}/approve-change`, { method: 'POST' }),
    onSuccess: () => {
      toast.success('RCM changes approved and effective!');
      queryClient.invalidateQueries({ queryKey: ['rcm'] });
      setCompareOpen(false);
    }
  });

  const rejectChangeMutation = useMutation({
    mutationFn: ({ rcmId, reason }: { rcmId: string, reason: string }) => 
      api(`/api/rcm/${rcmId}/reject-change`, { method: 'POST', body: JSON.stringify({ reason }) }),
    onSuccess: () => {
      toast.info('Change request rejected and returned to Line 1');
      queryClient.invalidateQueries({ queryKey: ['rcm'] });
      setRejectOpen(false);
      setCompareOpen(false);
      setRejectReason("");
    }
  });

  const createRcmMutation = useMutation({
    mutationFn: (data: typeof newRcmData) => api('/api/rcm', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success('New process added successfully');
      queryClient.invalidateQueries({ queryKey: ['rcm'] });
      setAddProcessOpen(false);
      setNewRcmData({ process: '', subProcess: '', riskDescription: '' });
    }
  });

  const controlsByRcmId = React.useMemo(() => {
    if (!controlsData) return {};
    return controlsData.items.reduce((acc, control) => {
      (acc[control.rcmId] = acc[control.rcmId] || []).push(control);
      return acc;
    }, {} as Record<string, Control[]>);
  }, [controlsData]);

  const handleEditControl = (control: Control) => {
    setSelectedControl(control);
    setEditorOpen(true);
  };

  const handleAddNewControl = (rcmId: string) => {
    const newControl: Partial<Control> = { rcmId, name: "New Control", description: "", assertions: [] };
    setSelectedControl(newControl as Control);
    setEditorOpen(true);
  };

  const reviewMutation = useMutation({
    mutationFn: (data: { csaId: string, status: string, comments: string }) => 
      api(`/api/csa/${data.csaId}/validate`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Validation submitted successfully");
      queryClient.invalidateQueries({ queryKey: ['csa'] });
    }
  });

  if (!['Line 1', 'Line 2', 'Admin'].includes(mockRole)) {
    return (
      <AppLayout container>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center flex flex-col items-center gap-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
              <h2 className="text-2xl font-bold">Access Denied</h2>
              <p className="text-muted-foreground">This workspace is restricted to Line 1 (Process Owners) and Line 2 (ICOFR).</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const isLoading = controlsLoading || csaLoading;
  
  let displayedControls = controlsData?.items || [];
  if (mockRole === 'Line 1') {
    displayedControls = displayedControls.filter(c => c.ownerId === mockUserId);
  }

  const getCsaForControl = (controlId: string) => {
    return csaData?.items?.filter(c => c.controlId === controlId).sort((a, b) => b.assessmentDate - a.assessmentDate)[0];
  };

  return (
    <AppLayout container>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Control Self-Assessment</h1>
            <p className="text-muted-foreground">
              {mockRole === 'Line 2' 
                ? "Review and validate assessments submitted by Process Owners." 
                : "Complete the self-assessment for your assigned controls."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {mockRole === 'Line 2' && (
              <>
                <Button variant="outline" size="sm"><FileDown className="h-4 w-4 mr-2" /> Export</Button>
                <Button size="sm" onClick={() => setAddProcessOpen(true)}><PlusCircle className="h-4 w-4 mr-2" /> Add Process</Button>
                <Badge variant="secondary" className="h-8 px-3 text-sm">Line 2 Mode</Badge>
              </>
            )}
          </div>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">Pending Action</TabsTrigger>
            <TabsTrigger value="completed">Completed History</TabsTrigger>
            <TabsTrigger value="risk-control">Risk Control</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)
            ) : (
              displayedControls.filter(c => {
                const csa = getCsaForControl(c.id);
                if (mockRole === 'Line 1') return !csa;
                if (mockRole === 'Line 2') return csa && csa.line2Status !== 'Validated' && csa.line2Status !== 'Rejected';
                return false;
              }).map(control => (
                <ControlAssessmentCard 
                  key={control.id} 
                  control={control} 
                  existingCsa={getCsaForControl(control.id)}
                  role={mockRole}
                  onReview={(data) => reviewMutation.mutate(data)}
                />
              ))
            )}
            {!isLoading && displayedControls.filter(c => {
                const csa = getCsaForControl(c.id);
                if (mockRole === 'Line 1') return !csa;
                if (mockRole === 'Line 2') return csa && csa.line2Status !== 'Validated' && csa.line2Status !== 'Rejected';
                return false;
              }).length === 0 && (
              <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">All caught up!</h3>
                <p className="text-muted-foreground">No pending assessments found.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
             {displayedControls.filter(c => {
                const csa = getCsaForControl(c.id);
                if (mockRole === 'Line 1') return !!csa;
                if (mockRole === 'Line 2') return csa && (csa.line2Status === 'Validated' || csa.line2Status === 'Rejected');
                return false;
              }).map(control => (
                <ControlAssessmentCard 
                  key={control.id} 
                  control={control} 
                  existingCsa={getCsaForControl(control.id)}
                  role={mockRole}
                />
              ))}
          </TabsContent>

          <TabsContent value="risk-control" className="space-y-6 pt-4">
            <div className="flex items-center gap-4">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search controls or risks..." className="pl-8" />
              </div>
            </div>

            <div className="space-y-8">
              {rcmLoading || controlsLoading ? (
                Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)
              ) : (
                rcmData?.items.map(rcm => (
                  <Card key={rcm.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{rcm.process} / {rcm.subProcess}</CardTitle>
                          <CardDescription className="mt-1 text-xs">
                            <span className="font-semibold text-foreground uppercase tracking-tight">Risk:</span> {rcm.riskDescription}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 text-[10px] gap-1"
                              onClick={() => { setSelectedRcm(rcm); setBpmOpen(true); }}
                            >
                              <Workflow className="h-3 w-3" /> BPM Flow
                            </Button>
                            <Badge variant={
                              rcm.status === 'Active' ? 'default' : 
                              rcm.status === 'Pending Validation' ? 'destructive' : 
                              rcm.status === 'Pending Change Approval' ? 'secondary' : 'secondary'
                            }>
                              {rcm.status}
                            </Badge>
                          </div>
                          {rcm.status === 'Pending Validation' && mockRole === 'Line 2' && (
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="h-7 text-[10px] uppercase font-bold"
                              onClick={() => validateMutation.mutate(rcm.id)}
                              disabled={validateMutation.isPending}
                            >
                              Validate Design (Lini 2)
                            </Button>
                          )}
                          {rcm.status === 'Pending Change Approval' && mockRole === 'Line 2' && (
                            <div className="p-2 border rounded bg-amber-50 border-amber-200 mt-2 space-y-2 max-w-[250px]">
                              <p className="text-[9px] font-bold text-amber-800 uppercase tracking-tighter">Proposed Changes by Lini 1</p>
                              <Button 
                                size="sm" 
                                className="h-7 text-[10px] w-full bg-amber-600 hover:bg-amber-700 gap-1 font-bold"
                                onClick={() => { setSelectedRcm(rcm); setCompareOpen(true); }}
                              >
                                <Eye className="h-3 w-3" /> Review Changes (Lampiran 6)
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(controlsByRcmId[rcm.id] || []).map(control => (
                          <div key={control.id} className="border p-4 rounded-md flex justify-between items-start bg-card hover:bg-accent/50 transition-colors gap-4 group">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                {control.isKeyControl && <ShieldCheck className="h-4 w-4 text-green-600" />}
                                <span className="font-mono text-xs font-bold text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                                  {control.code || "NO-CODE"}
                                </span>
                                <h4 className="font-semibold text-sm">{control.name}</h4>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">{control.description}</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline" className="text-[10px]">{control.frequency}</Badge>
                                <Badge variant="outline" className="text-[10px]">{control.type}</Badge>
                                <Badge variant="outline" className="text-[10px]">{control.nature}</Badge>
                                <Badge variant="secondary" className={cn(
                                  "text-[10px]",
                                  control.riskRating === 'High' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                )}>
                                  {control.riskRating} Risk
                                </Badge>
                              </div>
                            </div>
                            {mockRole === 'Line 2' && (
                              <Button variant="ghost" size="sm" onClick={() => handleEditControl(control)} className="opacity-0 group-hover:opacity-100">Edit</Button>
                            )}
                          </div>
                        ))}
                        {mockRole === 'Line 2' && (
                          <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => handleAddNewControl(rcm.id)}>
                            <PlusCircle className="h-4 w-4 mr-2" /> Add Control
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ControlEditor isOpen={isEditorOpen} setIsOpen={setEditorOpen} control={selectedControl} />
      
      {/* Comparison Dialog */}
      <Dialog open={isCompareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-amber-600" /> 
              Review Proposed RCM Changes
            </DialogTitle>
            <DialogDescription>
              Comparing current design with changes proposed by Lini 1.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedRcm?.changeRequest && (
              <RCMDiffViewer current={selectedRcm} proposed={selectedRcm.changeRequest.proposedData} />
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
              onClick={() => setRejectOpen(true)}
            >
              <XCircle className="h-4 w-4" /> Reject & Return
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 gap-2"
              onClick={() => approveChangeMutation.mutate(selectedRcm!.id)}
              disabled={approveChangeMutation.isPending}
            >
              <CheckCircle2 className="h-4 w-4" /> Approve & Persist Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Reject Change Request
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This feedback will be sent to the Process Owner (Lini 1).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Feedback</Label>
              <Textarea 
                id="reason" 
                placeholder="e.g. Risk description is not detailed enough according to PSAK..." 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              disabled={!rejectReason || rejectChangeMutation.isPending}
              onClick={() => rejectChangeMutation.mutate({ rcmId: selectedRcm!.id, reason: rejectReason })}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BPM Dialog */}
      <Dialog open={isBpmOpen} onOpenChange={setBpmOpen}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>BPM Flow: {selectedRcm?.process}</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-hidden">
            <React.Suspense fallback={<Skeleton className="h-full w-full" />}>
              {selectedRcm && <BPMEditor rcm={selectedRcm} controls={controlsData?.items || []} />}
            </React.Suspense>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Process Dialog */}
      <Dialog open={isAddProcessOpen} onOpenChange={setAddProcessOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Process / Risk</DialogTitle>
            <DialogDescription>
              Identify a new business process and its associated financial reporting risk.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="process">Process Name (Main)</Label>
              <Input 
                id="process" 
                placeholder="e.g. Order to Cash, Treasury..." 
                value={newRcmData.process}
                onChange={(e) => setNewRcmData(prev => ({ ...prev, process: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subProcess">Sub-Process Name</Label>
              <Input 
                id="subProcess" 
                placeholder="e.g. Sales Order Entry, Bank Reconciliation..." 
                value={newRcmData.subProcess}
                onChange={(e) => setNewRcmData(prev => ({ ...prev, subProcess: e.target.value }))}
              />
            </div>
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="risk" className="flex items-center gap-2">
                  Risk Description
                </Label>
                <RiskLibraryLookup onSelect={(risk) => setNewRcmData(prev => ({ ...prev, riskDescription: risk }))} />
              </div>
              <Textarea 
                id="risk" 
                placeholder="Describe what can go wrong in this process that affects financial reporting..." 
                className="min-h-[100px]"
                value={newRcmData.riskDescription}
                onChange={(e) => setNewRcmData(prev => ({ ...prev, riskDescription: e.target.value }))}
              />
              <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                <Info className="h-3 w-3" /> Tip: Penjelasan risiko harus mencakup asersi yang terancam (Completeness, Accuracy, etc).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddProcessOpen(false)}>Cancel</Button>
            <Button 
              className="bg-primary hover:bg-primary/90"
              disabled={!newRcmData.process || !newRcmData.riskDescription || createRcmMutation.isPending}
              onClick={() => createRcmMutation.mutate(newRcmData)}
            >
              {createRcmMutation.isPending ? "Creating..." : "Create RCM Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}