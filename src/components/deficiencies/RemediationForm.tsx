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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, Calendar, Lock } from 'lucide-react';
import type { ActionPlan } from '@shared/types';

import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { WorkflowPanel } from '../workflow/WorkflowPanel';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

interface DepartmentItem {
  id: string;
  name: string;
}

interface UserItem {
  id: string;
  name: string;
  email?: string;
  role?: string;
  departmentId?: string;
}

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

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api<{ items: DepartmentItem[] }>('/api/departments'),
    enabled: isOpen,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => api<{ items: UserItem[] }>('/api/users'),
    enabled: isOpen,
  });

  const departmentList = React.useMemo(() => {
    const list = departmentsData?.items ? departmentsData.items.map(d => d.name) : [];
    if (actionPlan?.relatedFunction && !list.includes(actionPlan.relatedFunction)) {
      list.unshift(actionPlan.relatedFunction);
    }
    return Array.from(new Set(list));
  }, [departmentsData, actionPlan?.relatedFunction]);

  const selectedFunction = form.watch('relatedFunction');

  const userList = React.useMemo(() => {
    if (!usersData?.items) {
      return actionPlan?.picName ? [actionPlan.picName] : [];
    }

    let filteredUsers = usersData.items;

    // Cascading filter: Filter users belonging to the selected department
    if (selectedFunction) {
      const selectedDeptObj = departmentsData?.items?.find(d => d.name === selectedFunction);
      if (selectedDeptObj) {
        filteredUsers = usersData.items.filter(u => u.departmentId === selectedDeptObj.id);
      }
    }

    const list = filteredUsers.map(u => u.name);
    if (actionPlan?.picName && !list.includes(actionPlan.picName)) {
      list.unshift(actionPlan.picName);
    }
    return Array.from(new Set(list));
  }, [usersData, departmentsData, selectedFunction, actionPlan?.picName]);

  // Track unsaved changes
  const isDirty = form.formState.isDirty;
  useUnsavedChanges(isOpen && isDirty);

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
        <div className="bg-mancity-pattern p-6 text-primary-foreground shrink-0">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2 text-primary-foreground font-display text-xl uppercase tracking-tight">
               <ShieldCheck className="h-6 w-6 text-primary-foreground" />
               {t('form.title')}
             </DialogTitle>
             <DialogDescription className="text-primary-foreground/60 text-xs font-medium">
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
                          <Select onValueChange={field.onChange} value={field.value} disabled={isWorkflowLocked}>
                            <FormControl>
                              <SelectTrigger className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg font-bold">
                                <SelectValue placeholder={t('form.placeholders.relatedFunction')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-[1100]">
                              {departmentList.map((dept, i) => (
                                <SelectItem key={i} value={dept} className="font-medium">
                                  {dept}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                          <Select onValueChange={field.onChange} value={field.value} disabled={isWorkflowLocked}>
                            <FormControl>
                              <SelectTrigger className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg font-bold">
                                <SelectValue placeholder={t('form.placeholders.picName')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-[1100]">
                              {userList.map((usr, i) => (
                                <SelectItem key={i} value={usr} className="font-medium">
                                  {usr}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
      </DialogContent>
    </Dialog>
  );
}
