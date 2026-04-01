import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck, Calendar } from 'lucide-react';
import type { ActionPlan } from '@shared/types';

const remediationSchema = z.object({
  relatedFunction: z.string().min(1, 'Fungsi Terkait wajib diisi (Lampiran 6)'),
  picName: z.string().min(1, 'Penanggung Jawab wajib diisi'),
  planDescription: z.string().min(1, 'Deskripsi Rencana wajib diisi'),
  activityDetail: z.string().min(1, 'Detail Aktivitas wajib diisi'),
  remediatedControlDescription: z.string().optional(),
  targetDate: z.string().min(1, 'Target Tanggal wajib diisi'),
});

type RemediationFormValues = z.infer<typeof remediationSchema>;

interface RemediationFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  actionPlan?: ActionPlan;
  onSubmit: (values: ActionPlan) => void;
  isLoading?: boolean;
}

export function RemediationForm({ isOpen, setIsOpen, actionPlan, onSubmit, isLoading }: RemediationFormProps) {
  const form = useForm<RemediationFormValues>({
    resolver: zodResolver(remediationSchema),
    defaultValues: {
      relatedFunction: actionPlan?.relatedFunction || "",
      picName: actionPlan?.picName || "",
      planDescription: actionPlan?.planDescription || "",
      activityDetail: actionPlan?.activityDetail || "",
      remediatedControlDescription: actionPlan?.remediatedControlDescription || "",
      targetDate: actionPlan?.targetDate ? new Date(actionPlan.targetDate).toISOString().split('T')[0] : "",
    },
  });

  React.useEffect(() => {
    if (actionPlan) {
      form.reset({
        relatedFunction: actionPlan.relatedFunction,
        picName: actionPlan.picName,
        planDescription: actionPlan.planDescription,
        activityDetail: actionPlan.activityDetail,
        remediatedControlDescription: actionPlan.remediatedControlDescription,
        targetDate: new Date(actionPlan.targetDate).toISOString().split('T')[0],
      });
    }
  }, [actionPlan, form]);

  const handleFormSubmit = (values: RemediationFormValues) => {
    if (!actionPlan) return;

    const updatedPlan: ActionPlan = {
      ...actionPlan,
      relatedFunction: values.relatedFunction,
      picName: values.picName,
      planDescription: values.planDescription,
      activityDetail: values.activityDetail,
      remediatedControlDescription: values.remediatedControlDescription,
      targetDate: new Date(values.targetDate).getTime(),
      dueDate: new Date(values.targetDate).getTime(), // Sync due date with target date for now
    };

    onSubmit(updatedPlan);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Remediation Plan (Lampiran 6)
          </DialogTitle>
          <DialogDescription>
            Lengkapi detail rencana tindak lanjut sesuai standar SK-5/2024.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="relatedFunction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Fungsi Terkait</FormLabel>
                    <FormControl><Input placeholder="e.g. Divisi Akuntansi" {...field} className="h-8 text-xs" /></FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="picName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Penanggung Jawab</FormLabel>
                    <FormControl><Input placeholder="Nama Personel" {...field} className="h-8 text-xs" /></FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Target Tanggal Remediasi</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type="date" {...field} className="h-8 text-xs pr-8" />
                      <Calendar className="absolute right-2 top-2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="planDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Deskripsi Rencana</FormLabel>
                  <FormControl><Textarea placeholder="Garis besar rencana perbaikan..." {...field} className="min-h-[60px] text-xs" /></FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="activityDetail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Detail Aktivitas</FormLabel>
                  <FormControl><Textarea placeholder="Langkah-langkah detail pelaksanaan..." {...field} className="min-h-[80px] text-xs" /></FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remediatedControlDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Deskripsi Kontrol Setelah Remediasi</FormLabel>
                  <FormControl><Textarea placeholder="Bagaimana bentuk kontrol setelah diperbaiki? (Opsional)" {...field} className="min-h-[60px] text-xs" /></FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} size="sm">Cancel</Button>
              <Button type="submit" disabled={isLoading} size="sm" className="bg-blue-600 hover:bg-blue-700">
                {isLoading ? "Saving..." : "Save Remediation Plan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
