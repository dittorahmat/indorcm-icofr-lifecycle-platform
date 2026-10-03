import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { getSuggestedSampleRange, isReadyForRemediationTest } from '@/lib/compliance-utils';
import type { Control, TestRecord } from '@shared/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, Clock, Loader2, ShieldCheck, Target, FileText, ChevronRight, Fingerprint } from 'lucide-react';
import { promptBiometricAuth } from '@/lib/forensic-utils';
import { ControlHistory } from './ControlHistory';
import { TODSixPillarForm } from './TODSixPillarForm';
import { RegulatorySamplingTable } from './RegulatorySamplingTable';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';

import { testSchema, TestFormValues } from './test-schema';

interface ControlTestCardProps {
  control: Control;
  openDeficiencyDate?: number;
  history: TestRecord[];
}

export function ControlTestCard({ control, openDeficiencyDate, history }: ControlTestCardProps) {
  const { t } = useTranslation('testing');
  const queryClient = useQueryClient();
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  
  const form = useForm<any>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      method: "Inspection",
      homogeneityJustification: "",
      evaluationAttributes: {
        objectiveAchieved: true,
        timingAccuracy: true,
        authorityCompetence: true,
        infoReliability: true,
        periodCoverage: true,
        evidenceAvailability: true,
      },
      todPilarObjective: true,
      todPilarTiming: true,
      todPilarAuthority: true,
      todPilarReliability: true,
      todPilarCoverage: true,
      todPilarEvidence: true,
      todPilarComments: {},
      samples: [],
    }
  });

  const { isDirty } = form.formState;
  useUnsavedChanges(isDirty);

  const suggestion = getSuggestedSampleRange(control.frequency as any, control.riskRating as any, control.nature as any);

  const remediationStatus = openDeficiencyDate ? isReadyForRemediationTest(control.frequency as any, openDeficiencyDate) : null;

  const mutation = useMutation({
    mutationFn: (data: Omit<TestRecord, 'id' | 'testDate' | 'testedBy'>) => api('/api/tests', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (data: TestRecord) => {
      toast.success(t('validation.submitSuccess', { type: data.testType, name: control.name }));
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      if (data.result === 'Ineffective') {
        queryClient.invalidateQueries({ queryKey: ['deficiencies'] });
      }
      form.reset();
    },
    onError: (error: any) => {
      toast.error(t('validation.submitError', { error: error.message }));
    },
  });

  const onSubmit = async (values: TestFormValues) => {
    // TOE validation
    if (values.testType === 'TOE') {
       if (values.sampleSize! < suggestion.min && !values.homogeneityJustification) {
        form.setError('homogeneityJustification', { 
          type: 'manual', 
          message: t('validation.belowMinJustificationRequired') 
        });
        return;
      }
      
      // Auto-set status based on samples (Zero Tolerance)
      if (values.samples.some(s => s.status === 'Fail')) {
        values.result = 'Ineffective';
      }
    }

    // TOD validation - if any pillar is unchecked, status must be Ineffective
    if (values.testType === 'TOD') {
      const pillars = [
        values.todPilarObjective, 
        values.todPilarTiming, 
        values.todPilarAuthority, 
        values.todPilarReliability, 
        values.todPilarCoverage, 
        values.todPilarEvidence
      ];
      if (pillars.some(p => p === false)) {
        values.result = 'Ineffective';
      }
    }

    setIsAuthenticating(true);
    const verified = await promptBiometricAuth('authenticate');
    setIsAuthenticating(false);

    if (!verified) {
      toast.error(t('validation.authFailed'));
      return;
    }

    mutation.mutate({
      organizationId: control.organizationId,
      controlId: control.id,
      period: "2024-Q1",
      ...values,
    } as any);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
      <Card className="overflow-hidden lg:col-span-3 border-slate-200 shadow-sm rounded-lg">
        <CardHeader className="bg-slate-50/50 border-b py-4 sm:py-6 px-4 sm:px-8">
          <div className="flex flex-wrap sm:flex-nowrap justify-between items-start gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge variant="outline" className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50/50 border-indigo-100">
                  {control.code}
                </Badge>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">•</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{control.frequency}</span>
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">{control.name}</CardTitle>
              <CardDescription className="text-xs font-normal text-slate-500 leading-relaxed max-w-2xl">
                {control.description}
              </CardDescription>
            </div>
            <Badge 
              className={cn(
                "text-xs uppercase font-bold tracking-wider px-2.5 sm:px-3 py-1 border-none shadow-xs shrink-0 rounded-md",
                control.riskRating === 'High' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
              )}
            >
              {control.riskRating} RISK
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 sm:pt-8 px-4 sm:px-8 pb-8 sm:pb-10">
          <AnimatePresence>
            {control.line2Validation?.status === 'Validated' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 sm:mb-8 p-3.5 sm:p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg flex items-center gap-3 sm:gap-4 shadow-xs"
              >
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">{t('validatedByL2')}</p>
                  <p className="text-xs text-emerald-700 font-normal leading-relaxed truncate sm:whitespace-normal">
                    "{control.line2Validation.comments}" 
                    <span className="ml-1.5 opacity-70 font-semibold">({new Date(control.line2Validation.validatedDate!).toLocaleDateString()})</span>
                  </p>
                </div>
              </motion.div>
            )}

            {remediationStatus && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "mb-6 sm:mb-8 p-4 sm:p-5 rounded-lg border flex items-start gap-3 sm:gap-4 shadow-xs",
                  remediationStatus.isReady ? 'bg-indigo-50/50 border-indigo-100' : 'bg-amber-50/50 border-amber-100'
                )}
              >
                <div className={cn(
                  "h-9 w-9 sm:h-10 sm:w-10 rounded-md flex items-center justify-center shrink-0 shadow-xs",
                  remediationStatus.isReady ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
                )}>
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className={cn(
                    "text-xs font-bold uppercase tracking-wider",
                    remediationStatus.isReady ? 'text-indigo-800' : 'text-amber-800'
                  )}>
                    {t('badges.remediationReadiness')}
                  </p>
                  <p className={cn("text-xs font-normal leading-relaxed", remediationStatus.isReady ? 'text-indigo-700' : 'text-amber-700')}>
                    {remediationStatus.message}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Tabs defaultValue="tod" className="w-full">
            <div className="bg-slate-100/70 p-1 border border-slate-200 rounded-lg w-full sm:w-fit mb-6 sm:mb-8">
              <TabsList className="bg-transparent h-auto p-0 grid grid-cols-1 sm:flex gap-1 w-full sm:w-auto">
                <TabsTrigger 
                  value="tod" 
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-xs data-[state=active]:text-indigo-600 transition-all font-bold text-xs uppercase tracking-wider py-2 px-3 sm:px-6 text-slate-500 justify-center min-h-[36px]"
                >
                  {t('tabs.tod')}
                </TabsTrigger>
                <TabsTrigger 
                  value="toe" 
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-xs data-[state=active]:text-indigo-600 transition-all font-bold text-xs uppercase tracking-wider py-2 px-3 sm:px-6 text-slate-500 justify-center min-h-[36px]"
                >
                  {t('tabs.toe')}
                </TabsTrigger>
              </TabsList>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                  <TabsContent value="tod" className="space-y-6 sm:space-y-8 m-0 outline-none">
                    <TODSixPillarForm form={form} t={t} />
                    
                    <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                       <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <Target className="h-4 w-4 text-indigo-500 shrink-0" />
                          Final Audit Verdict
                       </div>
                      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto">
                        <Button 
                          type="submit" 
                          disabled={isAuthenticating || mutation.isPending} 
                          onClick={() => { form.setValue('testType', 'TOD'); form.setValue('result', 'Ineffective'); }} 
                          variant="outline" 
                          className="h-11 px-6 sm:px-8 rounded-lg font-bold text-xs uppercase tracking-wider border-rose-200 text-rose-600 hover:bg-rose-50 transition-all min-h-[44px] justify-center"
                        >
                          {isAuthenticating ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <AlertTriangle className="h-4 w-4 mr-2"/>} 
                          {t('actions.ineffective')}
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={isAuthenticating || mutation.isPending} 
                          onClick={() => { form.setValue('testType', 'TOD'); form.setValue('result', 'Effective'); }} 
                          className="h-11 px-6 sm:px-8 rounded-lg font-bold text-xs uppercase tracking-wider bg-mancity-pattern hover:opacity-90 shadow-sm transition-all text-primary-foreground min-h-[44px] justify-center"
                        >
                          {isAuthenticating ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <ShieldCheck className="h-4 w-4 mr-2"/>} 
                          {t('actions.effective')}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="toe" className="space-y-6 sm:space-y-8 m-0 outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                      <div className="space-y-5 sm:space-y-6">
                        <div className={cn(
                          "p-4 sm:p-5 rounded-lg flex items-start gap-3 sm:gap-4 border transition-all duration-300",
                          form.watch('sampleSize') !== undefined && form.watch('sampleSize')! < suggestion.min 
                            ? "bg-rose-50/50 border-rose-200 shadow-xs" 
                            : "bg-indigo-50/50 border-indigo-100 shadow-xs"
                        )}>
                          <div className={cn(
                            "h-9 w-9 sm:h-10 sm:w-10 rounded-md flex items-center justify-center shrink-0 shadow-xs",
                            form.watch('sampleSize') !== undefined && form.watch('sampleSize')! < suggestion.min 
                              ? "bg-rose-100 text-rose-600" 
                              : "bg-indigo-100 text-indigo-600"
                          )}>
                            {form.watch('sampleSize') !== undefined && form.watch('sampleSize')! < suggestion.min ? (
                               <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
                            ) : (
                               <Info className="h-5 w-5 sm:h-6 sm:w-6" />
                            )}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <p className={cn(
                              "text-xs font-bold uppercase tracking-wider",
                              form.watch('sampleSize') !== undefined && form.watch('sampleSize')! < suggestion.min ? "text-rose-800" : "text-indigo-800"
                            )}>
                              {form.watch('sampleSize') !== undefined && form.watch('sampleSize')! < suggestion.min 
                                ? t('validation.samplingViolation') 
                                : t('toe.suggestion')}
                            </p>
                            <p className={cn(
                              "text-xs font-normal leading-relaxed",
                              form.watch('sampleSize') !== undefined && form.watch('sampleSize')! < suggestion.min ? "text-rose-700" : "text-indigo-700"
                            )}>
                              {form.watch('sampleSize') !== undefined && form.watch('sampleSize')! < suggestion.min 
                                ? t('validation.samplingWarning', { min: suggestion.min }) 
                                : `${t('toe.requiredSample')}: ${suggestion.label}`}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField control={form.control} name="sampleSize" render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-xs font-semibold uppercase text-slate-500 tracking-wider flex justify-between items-center px-0.5 flex-wrap gap-2">
                                <span>{t('toe.sampleSize')}</span>
                                {field.value !== undefined && field.value < suggestion.min && (
                                  <Badge variant="destructive" className="text-xs font-semibold h-5 px-1.5 border-none shadow-none uppercase rounded">
                                    {t('toe.belowMin')}
                                  </Badge>
                                )}
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={e => field.onChange(parseInt(e.target.value, 10))} 
                                    className={cn(
                                      "h-11 font-bold rounded-lg transition-all text-xs", 
                                      field.value !== undefined && field.value < suggestion.min 
                                        ? "border-rose-300 bg-rose-50 focus:ring-rose-500/20" 
                                        : "bg-slate-50 border-slate-200 focus:bg-white"
                                    )} 
                                  />
                                  <div className="absolute inset-y-0 right-3.5 flex items-center text-xs font-semibold text-slate-400 uppercase tracking-tight">
                                    Units
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage className="text-xs font-semibold" />
                            </FormItem>
                          )} />

                          <FormField control={form.control} name="method" render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-xs font-semibold uppercase text-slate-500 tracking-wider px-0.5">
                                {t('actions.method')}
                              </FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-11 font-semibold rounded-lg bg-slate-50 border-slate-200 focus:bg-white transition-all text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-lg border-slate-200">
                                  <SelectItem value="Inquiry" className="text-xs font-semibold py-2">Inquiry</SelectItem>
                                  <SelectItem value="Observation" className="text-xs font-semibold py-2">Observation</SelectItem>
                                  <SelectItem value="Inspection" className="text-xs font-semibold py-2">Inspection</SelectItem>
                                  <SelectItem value="Reperformance" className="text-xs font-semibold py-2">Reperformance</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                        </div>

                        <FormField control={form.control} name="homogeneityJustification" render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-semibold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 px-0.5">
                              <FileText className="h-3.5 w-3.5" />
                              <span>{t('toe.homogeneity')}</span>
                              {form.watch('sampleSize')! < suggestion.min && <span className="text-rose-500 font-bold">*</span>}
                            </FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className={cn(
                                  "min-h-[90px] text-xs font-normal rounded-lg resize-none transition-all p-3",
                                  form.watch('sampleSize')! < suggestion.min && !field.value 
                                    ? "border-rose-300 bg-rose-50/30 focus:ring-rose-500/20" 
                                    : "bg-slate-50 border-slate-200 focus:bg-white"
                                )} 
                                placeholder={t('toe.homogeneityPlaceholder')}
                              />
                            </FormControl>
                            <FormMessage className="text-xs font-semibold" />
                          </FormItem>
                        )} />
                      </div>

                      <div className="bg-slate-50/60 rounded-lg border border-slate-200 p-4 sm:p-5 space-y-3.5">
                         <div className="flex items-center justify-between flex-wrap gap-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                               <Target className="h-4 w-4 text-indigo-500" />
                               Regulatory Note
                            </h4>
                            <Badge variant="outline" className="text-xs font-semibold border-indigo-200 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">SAMPLE BASIS</Badge>
                         </div>
                         <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
                            <p className="text-xs text-slate-600 font-normal leading-relaxed">
                               Pengambilan sampel harus didasarkan pada populasi transaksi selama periode penilaian untuk memastikan efektivitas operasional yang konsisten.
                            </p>
                            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Requirement</span>
                               <span className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-1">Zero Tolerance <ChevronRight className="h-3.5 w-3.5" /></span>
                            </div>
                         </div>
                      </div>
                    </div>

                    <div className="space-y-3.5 pt-2">
                       <div className="flex items-center gap-2 px-0.5 mb-1">
                          <div className="h-2 w-2 rounded-full bg-indigo-500" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Transaction Sample Testing</h4>
                       </div>
                       <RegulatorySamplingTable control={form.control} t={t} />
                    </div>

                    <FormField control={form.control} name="comments" render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold uppercase text-slate-500 tracking-wider px-0.5">{t('toe.comments')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t('toe.placeholder')} 
                            {...field} 
                            className="min-h-[100px] text-xs font-normal bg-slate-50 border-slate-200 focus:bg-white rounded-lg transition-all resize-none p-3.5" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                       <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <Fingerprint className="h-4 w-4 text-indigo-500 shrink-0" />
                          Certified Evidence Submission
                       </div>
                      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto">
                        <Button 
                          type="submit" 
                          disabled={isAuthenticating || mutation.isPending} 
                          onClick={() => { form.setValue('testType', 'TOE'); form.setValue('result', 'Ineffective'); }} 
                          variant="outline" 
                          className="h-11 px-6 sm:px-8 rounded-lg font-bold text-xs uppercase tracking-wider border-rose-200 text-rose-600 hover:bg-rose-50 transition-all min-h-[44px] justify-center"
                        >
                          {isAuthenticating ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <AlertTriangle className="h-4 w-4 mr-2"/>} 
                          {t('actions.ineffective')}
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={isAuthenticating || mutation.isPending} 
                          onClick={() => { form.setValue('testType', 'TOE'); form.setValue('result', 'Effective'); }} 
                          className="h-11 px-6 sm:px-8 rounded-lg font-bold text-xs uppercase tracking-wider bg-mancity-pattern hover:opacity-90 shadow-sm transition-all text-primary-foreground min-h-[44px] justify-center"
                        >
                          {isAuthenticating ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <ShieldCheck className="h-4 w-4 mr-2"/>} 
                          {t('actions.effective')}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </motion.div>
              </form>
            </Form>
          </Tabs>

        </CardContent>
      </Card>

      <div className="lg:col-span-1">
        <ControlHistory history={history} />
      </div>
    </div>
  );
}
