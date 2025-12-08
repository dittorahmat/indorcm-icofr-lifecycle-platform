import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Control, ControlAssertion } from '@shared/types';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import { motion } from 'framer-motion';
const ALL_ASSERTIONS: ControlAssertion[] = ["Completeness", "Accuracy", "Validity", "Cut-off", "Presentation", "Existence"];
const controlSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['Preventive', 'Detective']),
  nature: z.enum(['Manual', 'IT-Dependent', 'Automated']),
  materiality: z.enum(['High', 'Medium', 'Low']),
  assertions: z.array(z.string()).optional(),
});
type ControlEditorProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  control: Partial<Control> | null;
};
export function ControlEditor({ isOpen, setIsOpen, control }: ControlEditorProps) {
  const queryClient = useQueryClient();
  const [evidenceFile, setEvidenceFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const form = useForm<z.infer<typeof controlSchema>>({
    resolver: zodResolver(controlSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'Preventive',
      nature: 'Manual',
      materiality: 'Low',
      assertions: [],
    },
  });
  React.useEffect(() => {
    if (control) {
      form.reset({
        name: control.name || '',
        description: control.description || '',
        type: control.type || 'Preventive',
        nature: control.nature || 'Manual',
        materiality: control.materiality || 'Low',
        assertions: control.assertions || [],
      });
    }
  }, [control, form]);
  const mutation = useMutation({
    mutationFn: (updatedControl: Partial<Control>) => {
      const apiCall = control?.id
        ? api(`/api/controls/${control.id}`, { method: 'PUT', body: JSON.stringify(updatedControl) })
        : api('/api/controls', { method: 'POST', body: JSON.stringify({ ...updatedControl, rcmId: control?.rcmId }) });
      return apiCall;
    },
    onSuccess: () => {
      toast.success('Control saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['controls'] });
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to save control: ${error.message}`);
    },
  });
  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setEvidenceFile(file);
      setPreview('https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=800&auto=format&fit=crop');
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });
  const onSubmit = (values: z.infer<typeof controlSchema>) => {
    mutation.mutate(values);
  };
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-lg">
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          <SheetHeader>
            <SheetTitle>{control?.id ? 'Edit Control' : 'Add New Control'}</SheetTitle>
            <SheetDescription>Manage the details of this control activity.</SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Control Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Preventive">Preventive</SelectItem><SelectItem value="Detective">Detective</SelectItem></SelectContent></Select></FormItem>
                )} />
                <FormField control={form.control} name="nature" render={({ field }) => (
                  <FormItem><FormLabel>Nature</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Manual">Manual</SelectItem><SelectItem value="IT-Dependent">IT-Dependent</SelectItem><SelectItem value="Automated">Automated</SelectItem></SelectContent></Select></FormItem>
                )} />
                <FormField control={form.control} name="materiality" render={({ field }) => (
                  <FormItem><FormLabel>Materiality</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent></Select></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="assertions" render={() => (
                <FormItem><FormLabel>Assertions</FormLabel>
                  <div className="grid grid-cols-2 gap-2 rounded-md border p-4">
                    {ALL_ASSERTIONS.map((item) => (
                      <FormField key={item} control={form.control} name="assertions" render={({ field }) => (
                        <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {
                            return checked ? field.onChange([...(field.value || []), item]) : field.onChange(field.value?.filter((value) => value !== item));
                          }} /></FormControl>
                          <FormLabel className="font-normal">{item}</FormLabel>
                        </FormItem>
                      )} />
                    ))}
                  </div>
                </FormItem>
              )} />
              <div>
                <Label>BPM Artifacts (Flowchart/Narrative)</Label>
                {!evidenceFile ? (
                  <div {...getRootProps()} className={`mt-2 flex justify-center rounded-md border-2 border-dashed border-input px-6 pt-5 pb-6 cursor-pointer hover:border-primary ${isDragActive ? 'border-primary bg-accent' : ''}`}>
                    <input {...getInputProps()} />
                    <div className="space-y-1 text-center"><UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" /><p className="text-sm text-muted-foreground">Drag & drop or click to upload</p></div>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-between rounded-md border border-input p-3">
                    <div className="flex items-center gap-2">
                      {preview && <img src={preview} alt="preview" className="h-10 w-10 rounded object-cover" />}
                      <span className="text-sm font-medium">{evidenceFile.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setEvidenceFile(null); setPreview(null); }}><X className="h-4 w-4" /></Button>
                  </div>
                )}
              </div>
              <SheetFooter className="mt-8">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save Control'}</Button>
              </SheetFooter>
            </form>
          </Form>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}