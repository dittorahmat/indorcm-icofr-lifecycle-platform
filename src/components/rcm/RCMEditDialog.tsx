import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from 'react-i18next';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Info, ShieldAlert, CheckCircle2, History } from 'lucide-react';
import { SignificantApplicationCombobox } from './SignificantApplicationCombobox';
import { WorkflowPanel } from '../workflow/WorkflowPanel';
import { RCMComplianceTab } from './RCMComplianceTab';
import {
  createRcmFormSchema,
  defaultRcmValues,
  resolveRcmWorkflowStatus,
  valuesFromData,
} from './rcm-form-schema';
import type { RcmDialogSource, RcmFormValues } from './rcm-form-schema';

interface RCMEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: RcmDialogSource | null;
  onSave: (values: RcmFormValues) => void;
  isSaving?: boolean;
}

export function RCMEditDialog({ open, onOpenChange, data, onSave, isSaving }: RCMEditDialogProps) {
  const { t } = useTranslation(['rcm', 'bpm', 'risklibrary', 'common']);

  const formSchema = React.useMemo(() => createRcmFormSchema((key: string) => t(key)), [t]);

  const form = useForm<RcmFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultRcmValues,
  });

  // Reset form when data changes
  React.useEffect(() => {
    if (data && open) {
      form.reset(valuesFromData(data));
    }
  }, [data, open, form]);

  useUnsavedChanges(form.formState.isDirty && open);

  const handleSubmit = (values: RcmFormValues) => {
    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col p-0 overflow-hidden border-slate-300 shadow-2xl rounded-none sm:rounded-lg">
        <DialogHeader className="p-3.5 sm:p-4 pb-2 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
             <div className="bg-indigo-600 p-1.5 rounded-lg text-white shadow-sm shrink-0">
                <ShieldAlert className="h-4 w-4" />
             </div>
             <div className="min-w-0 flex-1">
                <DialogTitle className="text-sm sm:text-base font-black tracking-tight text-slate-900 truncate">
                  {t('matrix.control_name')}: {data?.controlCode || '-'}
                </DialogTitle>
                <DialogDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-0.5 truncate">
                  {t('matrix.dialog.workbench_subtitle')}
                </DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="px-3 sm:px-6 bg-slate-50 border-b border-slate-200 overflow-x-auto shrink-0">
                <TabsList className="bg-transparent h-11 sm:h-12 p-0 gap-4 sm:gap-8 justify-start w-max">
                  <TabsTrigger
                    value="general"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 font-bold uppercase text-xs tracking-wider"
                  >
                    <Info className="h-3.5 w-3.5 mr-2" /> {t('matrix.sections.general')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="risk"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 font-black uppercase text-xs tracking-wider"
                  >
                    <ShieldAlert className="h-3.5 w-3.5 mr-2" /> {t('matrix.sections.risk_control')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="compliance"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 font-black uppercase text-xs tracking-wider"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> {t('matrix.sections.compliance')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="workflow"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 font-black uppercase text-xs tracking-wider"
                  >
                    <History className="h-3.5 w-3.5 mr-2" /> {t('matrix.dialog.workflow_tab')}
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 p-6">
                {/* General Info Tab */}
                <TabsContent value="general" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="processName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.process_info')}</FormLabel>
                              <FormControl><Input {...field} value={field.value ?? ''} readOnly className="bg-slate-50 border-slate-200 min-h-[44px] text-base md:text-sm font-semibold text-slate-700" /></FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="subProcessName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.sub_process')}</FormLabel>
                              <FormControl><Input {...field} value={field.value ?? ''} readOnly className="bg-slate-50 border-slate-200 min-h-[44px] text-base md:text-sm font-semibold text-slate-700" /></FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="fsliName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.dialog.fsli')}</FormLabel>
                              <FormControl><Input {...field} value={field.value ?? ''} readOnly className="bg-slate-50 border-slate-200 min-h-[44px] text-base md:text-sm font-semibold text-slate-700" /></FormControl>
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <FormField
                            control={form.control}
                            name="noGL"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.dialog.no_gl')}</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''} readOnly className="bg-slate-50 border-slate-200 min-h-[44px] text-base md:text-sm font-mono font-bold text-indigo-700" /></FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="bpmCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.dialog.bpm_code')}</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''} readOnly className="bg-slate-50 border-slate-200 min-h-[44px] text-base md:text-sm font-mono font-bold text-indigo-700" /></FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                   </div>

                   <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4 flex items-start gap-3">
                      <div className="bg-white p-1.5 rounded-full shadow-sm">
                         <Info className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                         <p className="text-xs font-bold text-indigo-900 leading-tight">{t('matrix.dialog.regulatory_title')}</p>
                         <p className="text-xs text-indigo-700 mt-1 leading-relaxed opacity-80">
                           {t('matrix.dialog.regulatory_desc')}
                         </p>
                      </div>
                   </div>
                </TabsContent>

                {/* Risk & Control Tab */}
                <TabsContent value="risk" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="grid grid-cols-12 gap-6">
                      <div className="col-span-12 space-y-4">
                        <FormField
                          control={form.control}
                          name="riskDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.risk_description')}</FormLabel>
                              <FormControl><Textarea {...field} value={field.value ?? ''} rows={3} className="min-h-[44px] text-base md:text-sm border-slate-200 focus:border-indigo-300 transition-all leading-normal" /></FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 sm:col-span-6 space-y-4">
                        <FormField
                          control={form.control}
                          name="mappedControlName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.control_name')}</FormLabel>
                              <FormControl><Input {...field} value={field.value ?? ''} className="min-h-[44px] text-base md:text-sm border-slate-200 font-bold" /></FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mappedControlDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.control_description')}</FormLabel>
                              <FormControl><Textarea {...field} value={field.value ?? ''} rows={5} className="min-h-[44px] text-base md:text-sm border-slate-200 leading-relaxed" /></FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 sm:col-span-6 space-y-4">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <FormField
                              control={form.control}
                              name="riskRating"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.risk_rating')}</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                                    <FormControl>
                                      <SelectTrigger className="text-base sm:text-xs h-11 sm:h-9 min-h-[44px] sm:min-h-0 border-slate-200"><SelectValue /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="High" className="text-xs text-rose-600 font-bold">{t('risklibrary:form.high')}</SelectItem>
                                      <SelectItem value="Medium" className="text-xs text-amber-600 font-bold">{t('risklibrary:form.medium')}</SelectItem>
                                      <SelectItem value="Low" className="text-xs text-emerald-600 font-bold">{t('risklibrary:form.low')}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="isFraudRelated"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-200 p-2 min-h-[44px] bg-white mt-auto flex-wrap gap-2">
                                  <FormLabel className="text-xs font-black uppercase text-slate-400 mb-0">{t('matrix.is_fraud')}</FormLabel>
                                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                              )}
                            />
                         </div>

                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                           <FormField
                              control={form.control}
                              name="controlType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.type')}</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                                    <FormControl>
                                      <SelectTrigger className="text-base sm:text-xs h-11 sm:h-9 min-h-[44px] sm:min-h-0 border-slate-200"><SelectValue /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Preventive" className="text-xs">{t('matrix.options.type.preventive')}</SelectItem>
                                      <SelectItem value="Detective" className="text-xs">{t('matrix.options.type.detective')}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="controlNature"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.nature')}</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                                    <FormControl>
                                      <SelectTrigger className="text-base sm:text-xs h-11 sm:h-9 min-h-[44px] sm:min-h-0 border-slate-200"><SelectValue /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Manual" className="text-xs">{t('matrix.options.nature.manual')}</SelectItem>
                                      <SelectItem value="Automated" className="text-xs">{t('matrix.options.nature.automated')}</SelectItem>
                                      <SelectItem value="ITDM - IPE" className="text-xs">{t('matrix.options.nature.itdm_ipe')}</SelectItem>
                                      <SelectItem value="ITDM - EUC" className="text-xs">{t('matrix.options.nature.itdm_euc')}</SelectItem>
                                      <SelectItem value="MRC" className="text-xs">{t('matrix.options.nature.mrc')}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                         </div>

                         <FormField
                            control={form.control}
                            name="applicationId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.significant_application', { defaultValue: 'Significant Application' })}</FormLabel>
                                <FormControl>
                                  <SignificantApplicationCombobox
                                    value={field.value ?? null}
                                    appName={form.watch('supportingApp') ?? ''}
                                    onChange={(appId, appName) => {
                                      field.onChange(appId);
                                      form.setValue('supportingApp', appName || '', { shouldDirty: true });
                                    }}
                                  />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />

                         <FormField
                            control={form.control}
                            name="frequency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.frequency')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                                  <FormControl>
                                    <SelectTrigger className="text-base sm:text-xs h-11 sm:h-9 min-h-[44px] sm:min-h-0 border-slate-200"><SelectValue /></SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Annual" className="text-xs">{t('matrix.options.frequency.annual')}</SelectItem>
                                    <SelectItem value="Semi-Annual" className="text-xs">{t('matrix.options.frequency.semi_annual')}</SelectItem>
                                    <SelectItem value="Quarterly" className="text-xs">{t('matrix.options.frequency.quarterly')}</SelectItem>
                                    <SelectItem value="Monthly" className="text-xs">{t('matrix.options.frequency.monthly')}</SelectItem>
                                    <SelectItem value="Weekly" className="text-xs">{t('matrix.options.frequency.weekly')}</SelectItem>
                                    <SelectItem value="Daily" className="text-xs">{t('matrix.options.frequency.daily')}</SelectItem>
                                    <SelectItem value="Ad-hoc" className="text-xs">{t('matrix.options.frequency.adhoc')}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                      </div>
                   </div>
                </TabsContent>

                {/* Compliance Tab */}
                <TabsContent value="compliance" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <RCMComplianceTab form={form} t={(key: string) => t(key)} />
                </TabsContent>

                {/* Workflow & Approval Tab */}
                <TabsContent value="workflow" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="space-y-4">
                      <WorkflowPanel
                        entityType="RCM_CHANGE"
                        entityId={data?.rcmId || (typeof data?.id === 'string' ? data.id : '') || ''}
                        currentStatus={resolveRcmWorkflowStatus(data ?? {})}
                        history={data?.workflowHistory ?? []}
                        onStatusChange={(newStatus) => {
                          if (data) {
                            data.workflowStatus = newStatus;
                          }
                        }}
                        isDirty={form.formState.isDirty}
                      />
                   </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <DialogFooter className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-4 flex-col-reverse sm:flex-row gap-2">
               <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-2">
                    {form.formState.isDirty && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 font-semibold text-xs uppercase px-2 py-0.5">
                        {t('common:unsavedChanges.title')}
                      </Badge>
                    )}
                  </div>
                   <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-xs font-bold px-4 sm:px-6 rounded-md">
                      {t('common:actions.cancel')}
                    </Button>
                    <Button type="submit" disabled={isSaving || !form.formState.isDirty} className="w-full sm:w-auto h-11 sm:h-9 min-h-[44px] sm:min-h-0 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold px-4 sm:px-8 shadow-sm rounded-md">
                      {isSaving ? t('matrix.dialog.saving') : t('matrix.dialog.update_mapping')}
                    </Button>
                  </div>
               </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
