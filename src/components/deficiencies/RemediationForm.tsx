import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck, Calendar, Lock } from 'lucide-react';
import type { ActionPlan } from '@shared/types';

import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';
import { WorkflowPanel } from '../workflow/WorkflowPanel';
import { useQueryClient } from '@tanstack/react-query';

const remediationSchema = z.object({
  relatedFunction: z.string().min(1, 'Related Function is required'),
  picName: z.string().min(1, 'Person In Charge is required'),
  planDescription: z.string().min(1, 'Plan Description is required'),
  activityDetail: z.string().min(1, 'Activity Detail is required'),
  remediatedControlDescription: z.string().optional(),
  targetDate: z.string().min(1, 'Target Date is required'),
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
  const { t } = useTranslation('deficiency');
  const queryClient = useQueryClient();

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

  // Track unsaved changes
  const isDirty = form.formState.isDirty;
  const blocker = useUnsavedChanges(isOpen && isDirty);

  const isWorkflowLocked = React.useMemo(() => {
    if (!actionPlan) return false;
    const status = actionPlan.workflowStatus || 'Ineffective';
    return status !== 'Ineffective';
  }, [actionPlan]);

  React.useEffect(() => {
    if (actionPlan) {
      form.reset({
        relatedFunction: actionPlan.relatedFunction || "",
        picName: actionPlan.picName || "",
        planDescription: actionPlan.planDescription || "",
        activityDetail: actionPlan.activityDetail || "",
        remediatedControlDescription: actionPlan.remediatedControlDescription || "",
        targetDate: actionPlan.targetDate ? new Date(actionPlan.targetDate).toISOString().split('T')[0] : "",
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
      dueDate: new Date(values.targetDate).getTime(),
    };

    onSubmit(updatedPlan);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl overflow-y-auto max-h-[90vh] flex flex-col p-0 border-none">
        <div className="bg-indigo-900 p-6 text-white shrink-0">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2 text-white font-display text-xl uppercase tracking-tight">
               <ShieldCheck className="h-6 w-6 text-yellow-400" />
               {t('form.title')}
             </DialogTitle>
             <DialogDescription className="text-indigo-200 text-xs font-medium">
               {t('form.description')}
             </DialogDescription>
           </DialogHeader>
        </div>

        <div className="flex flex-1 overflow-hidden">
           <div className="flex-1 p-6 overflow-y-auto bg-white">
              {isWorkflowLocked && (
                <div className="mb-6 bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-3 text-amber-800 text-xs font-bold shadow-sm">
                   <div className="bg-amber-100 p-2 rounded-full">
                      <Lock className="h-4 w-4" /> 
                   </div>
                   This plan is currently submitted for review/approval and cannot be modified.
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="relatedFunction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{t('form.fields.relatedFunction')}</FormLabel>
                          <FormControl><Input placeholder={t('form.placeholders.relatedFunction')} {...field} className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg font-bold" disabled={isWorkflowLocked} /></FormControl>
                          <FormMessage className="text-xs text-rose-500 font-bold" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="picName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{t('form.fields.picName')}</FormLabel>
                          <FormControl><Input placeholder={t('form.placeholders.picName')} {...field} className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg font-bold" disabled={isWorkflowLocked} /></FormControl>
                          <FormMessage className="text-xs text-rose-500 font-bold" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="targetDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{t('form.fields.targetDate')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type="date" {...field} className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg font-bold pr-10" disabled={isWorkflowLocked} />
                            <Calendar className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-rose-500 font-bold" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="planDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{t('form.fields.planDescription')}</FormLabel>
                        <FormControl><Textarea placeholder={t('form.placeholders.planDescription')} {...field} className="min-h-[80px] bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg font-medium text-sm" disabled={isWorkflowLocked} /></FormControl>
                        <FormMessage className="text-xs text-rose-500 font-bold" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="activityDetail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{t('form.fields.activityDetail')}</FormLabel>
                        <FormControl><Textarea placeholder={t('form.placeholders.activityDetail')} {...field} className="min-h-[100px] bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg font-medium text-sm" disabled={isWorkflowLocked} /></FormControl>
                        <FormMessage className="text-xs text-rose-500 font-bold" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="remediatedControlDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{t('form.fields.remediatedControlDescription')}</FormLabel>
                        <FormControl><Textarea placeholder={t('form.placeholders.remediatedControlDescription')} {...field} className="min-h-[100px] bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg font-medium text-sm" disabled={isWorkflowLocked} /></FormControl>
                        <FormMessage className="text-xs text-rose-500 font-bold" />
                      </FormItem>
                    )}
                  />

                  {!isWorkflowLocked && (
                    <DialogFooter className="pt-6 border-t">
                      <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600">Cancel</Button>
                      <Button type="submit" disabled={isLoading} className="h-10 px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 rounded-lg font-bold text-[10px] uppercase tracking-widest text-white">
                        {isLoading ? "Saving..." : "Save Remediation Plan"}
                      </Button>
                    </DialogFooter>
                  )}
                </form>
              </Form>
           </div>

           <div className="w-[350px] border-l bg-slate-50 flex flex-col shrink-0">
              {actionPlan && (
                <WorkflowPanel 
                  entityType="ACTION_PLAN"
                  entityId={actionPlan.id}
                  currentStatus={actionPlan.workflowStatus || 'Ineffective'}
                  history={actionPlan.workflowHistory || []}
                  onStatusChange={() => {
                    queryClient.invalidateQueries({ queryKey: ['actionplans'] });
                  }}
                  isDirty={isDirty}
                  className="h-full border-none shadow-none rounded-none"
                />
              )}
           </div>
        </div>
        <UnsavedChangesDialog blocker={blocker} />
      </DialogContent>
    </Dialog>
  );
}
