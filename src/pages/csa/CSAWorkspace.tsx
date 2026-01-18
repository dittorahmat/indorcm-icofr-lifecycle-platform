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
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { api } from '@/lib/api-client';
import type { Control, CSARecord } from '@shared/types';
import { toast } from 'sonner';
import { UploadCloud, File as FileIcon, X, AlertTriangle, CheckCircle2, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const csaSchema = z.object({
  result: z.enum(['Pass', 'Fail', 'N/A']),
  comments: z.string().optional(),
});

const reviewSchema = z.object({
  status: z.enum(['Validated', 'Rejected']),
  comments: z.string().min(1, "Review comments are required"),
});

function ControlAssessmentCard({ control, existingCsa, role, onReview }: { control: Control, existingCsa?: CSARecord, role: string, onReview?: (data: any) => void }) {
  const queryClient = useQueryClient();
  const [evidenceFile, setEvidenceFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);

  const form = useForm<z.infer<typeof csaSchema>>({
    resolver: zodResolver(csaSchema),
    defaultValues: { result: existingCsa?.result || 'Pass', comments: existingCsa?.comments || '' },
  });

  const reviewForm = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { status: 'Validated', comments: '' }
  });

  const mutation = useMutation({
    mutationFn: (data: Omit<CSARecord, 'id' | 'assessmentDate' | 'assessedBy'>) => api('/api/csa', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (data: CSARecord) => {
      toast.success(`Assessment for ${control.name} submitted.`);
      if (data.result === 'Fail') {
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
      result: values.result,
      comments: values.comments || '',
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
              <Badge variant={existingCsa.result === 'Pass' ? 'default' : 'destructive'} className="text-[10px]">
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
                <div className="col-span-2">
                  <span className="font-bold">Comments:</span> {existingCsa.comments}
                </div>
              </div>
            </div>

            {!isReviewed ? (
              <div className="border-t pt-4">
                <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-blue-600" /> Line 2 Validation (ICOFR Function)
                </h4>
                <div className="space-y-3">
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
                    onClick={reviewForm.handleSubmit((data) => onReview?.({ ...data, csaId: existingCsa.id }))}
                  >
                    Submit Validation
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-green-50/50 p-3 rounded border border-green-100 text-sm">
                <p className="font-bold text-green-800">Validated by Line 2</p>
                <p className="text-green-700">{existingCsa.line2Comments}</p>
              </div>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <fieldset disabled={!!existingCsa || isLine2} className="space-y-6">
                <FormField control={form.control} name="result" render={({ field }) => (
                  <FormItem className="space-y-3"><FormLabel className="font-semibold">Is the control operating effectively?</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Pass" /></FormControl><FormLabel className="font-normal">Pass</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Fail" /></FormControl><FormLabel className="font-normal">Fail</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="N/A" /></FormControl><FormLabel className="font-normal">N/A</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>
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

export function CSAWorkspace() {
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
  const mockUserId = 'u1'; // In real app, get from auth context

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
  
  // Logic for display:
  // Line 1: Shows assigned controls.
  // Line 2: Shows ALL controls that have CSA submissions needing review (or history).
  
  let displayedControls = controlsData?.items || [];
  if (mockRole === 'Line 1') {
    displayedControls = displayedControls.filter(c => c.ownerId === mockUserId);
  }

  const getCsaForControl = (controlId: string) => {
    // Return latest CSA
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
          {mockRole === 'Line 2' && (
            <Badge variant="secondary" className="h-8 px-3 text-sm">Line 2 Mode</Badge>
          )}
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">Pending Action</TabsTrigger>
            <TabsTrigger value="completed">Completed History</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)
            ) : (
              displayedControls.filter(c => {
                const csa = getCsaForControl(c.id);
                if (mockRole === 'Line 1') return !csa; // Show if no CSA yet
                if (mockRole === 'Line 2') return csa && csa.line2Status !== 'Validated' && csa.line2Status !== 'Rejected'; // Show if CSA exists but not validated
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
            {!isLoading && displayedControls.length === 0 && (
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
        </Tabs>
      </div>
    </AppLayout>
  );
}
