import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { api } from '@/lib/api-client';
import type { Control, CSARecord } from '@shared/types';
import { toast } from 'sonner';
import { UploadCloud, File as FileIcon, X, AlertTriangle } from 'lucide-react';
const csaSchema = z.object({
  result: z.enum(['Pass', 'Fail', 'N/A']),
  comments: z.string().optional(),
});
function ControlAssessmentCard({ control }: { control: Control }) {
  const queryClient = useQueryClient();
  const [evidenceFile, setEvidenceFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const form = useForm<z.infer<typeof csaSchema>>({
    resolver: zodResolver(csaSchema),
    defaultValues: { result: 'Pass' },
  });
  const mutation = useMutation({
    mutationFn: (data: Omit<CSARecord, 'id' | 'assessmentDate' | 'assessedBy'>) => api('/api/csa', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (data: CSARecord) => {
      toast.success(`Assessment for ${control.name} submitted.`);
      if (data.result === 'Fail') {
        queryClient.invalidateQueries({ queryKey: ['deficiencies'] });
      }
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
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>{control.name}</CardTitle>
        <CardDescription>{control.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="result" render={({ field }) => (
              <FormItem className="space-y-3"><FormLabel className="font-semibold">Is the control operating effectively?</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Pass" /></FormControl><FormLabel className="font-normal">Pass</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Fail" /></FormControl><FormLabel className="font-normal">Fail</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="N/A" /></FormControl><FormLabel className="font-normal">N/A</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="comments" render={({ field }) => (
              <FormItem><FormLabel className="font-semibold">Comments</FormLabel><FormControl><Textarea placeholder="Provide comments or context..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div>
              <Label className="font-semibold">Evidence</Label>
              {!evidenceFile ? (
                <div {...getRootProps()} className={`mt-2 flex justify-center rounded-md border-2 border-dashed border-input px-6 pt-5 pb-6 cursor-pointer hover:border-primary ${isDragActive ? 'border-primary bg-accent' : ''}`}>
                  <input {...getInputProps()} />
                  <div className="space-y-1 text-center"><UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" /><p className="text-sm text-muted-foreground">Drag & drop a file here, or click to select</p></div>
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-between rounded-md border border-input p-3">
                  <div className="flex items-center gap-2">{preview && preview.startsWith('data:image') ? <img src={preview} alt="preview" className="h-10 w-10 rounded object-cover" /> : <FileIcon className="h-8 w-8 text-muted-foreground" />}<span className="text-sm font-medium">{evidenceFile.name}</span></div>
                  <Button variant="ghost" size="icon" onClick={() => { setEvidenceFile(null); setPreview(null); }}><X className="h-4 w-4" /></Button>
                </div>
              )}
            </div>
            <div className="flex justify-end"><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Submitting...' : 'Submit Assessment'}</Button></div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
export function CSAWorkspace() {
  const { data: controlsData, isLoading } = useQuery({
    queryKey: ['controls'],
    queryFn: () => api<{ items: Control[] }>('/api/controls'),
  });
  const mockRole = localStorage.getItem('mockRole') || 'Line 1';
  if (mockRole !== 'Line 1') {
    return (
      <div className="flex flex-col min-h-screen bg-muted/40">
        <MainHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card>
              <CardContent className="p-8 text-center flex flex-col items-center gap-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-muted-foreground">This workspace is only available to Process Owners (Line 1).</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }
  const mockUserId = 'u1';
  const assignedControls = controlsData?.items.filter(c => c.ownerId === mockUserId);
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <MainHeader />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <h1 className="text-3xl font-bold mb-2">Control Self-Assessment</h1>
            <p className="text-muted-foreground mb-8">Complete the self-assessment for your assigned controls for this period.</p>
            <div className="space-y-6">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96 w-full" />)
              ) : assignedControls && assignedControls.length > 0 ? (
                assignedControls.map(control => <ControlAssessmentCard key={control.id} control={control} />)
              ) : (
                <Card><CardContent className="p-8 text-center text-muted-foreground">You have no controls assigned for self-assessment.</CardContent></Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}