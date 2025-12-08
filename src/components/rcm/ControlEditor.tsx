import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Control } from '@shared/types';
const controlSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['Preventive', 'Detective']),
  nature: z.enum(['Manual', 'IT-Dependent', 'Automated']),
  materiality: z.enum(['High', 'Medium', 'Low']),
});
type ControlEditorProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  control: Partial<Control> | null;
};
export function ControlEditor({ isOpen, setIsOpen, control }: ControlEditorProps) {
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof controlSchema>>({
    resolver: zodResolver(controlSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'Preventive',
      nature: 'Manual',
      materiality: 'Low',
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
  const onSubmit = (values: z.infer<typeof controlSchema>) => {
    mutation.mutate(values);
  };
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{control?.id ? 'Edit Control' : 'Add New Control'}</SheetTitle>
          <SheetDescription>
            Manage the details of this control activity.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Control Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="Preventive">Preventive</SelectItem><SelectItem value="Detective">Detective</SelectItem></SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="nature" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nature</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="Manual">Manual</SelectItem><SelectItem value="IT-Dependent">IT-Dependent</SelectItem><SelectItem value="Automated">Automated</SelectItem></SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="materiality" render={({ field }) => (
                <FormItem>
                  <FormLabel>Materiality</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>
            <SheetFooter className="mt-8">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save Control'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}