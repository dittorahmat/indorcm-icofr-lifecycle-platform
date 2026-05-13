import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
import { motion } from 'framer-motion';
import { AlertTriangle, Info, Clock, UserCheck, Loader2 } from 'lucide-react';
import { promptBiometricAuth } from '@/lib/forensic-utils';
import { EvaluationAttributesSection } from './EvaluationAttributesSection';
import { ControlHistory } from './ControlHistory';
import { TODSixPillarForm } from './TODSixPillarForm';
import { RegulatorySamplingTable } from './RegulatorySamplingTable';
import { useBlocker } from 'react-router-dom';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';

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
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="overflow-hidden lg:col-span-2">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base">{control.code}: {control.name}</CardTitle>
              <CardDescription className="text-xs">{control.description}</CardDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
               <Badge variant="outline" className="text-xs">{control.frequency}</Badge>
               <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs uppercase font-bold",
                    control.riskRating === 'High' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                  )}
                >
                  {control.riskRating === 'High' ? t('badges.highRisk') : t('badges.lowRisk')}
                </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {control.line2Validation?.status === 'Validated' && (
            <div className="mb-6 p-3 bg-green-50 border border-green-100 rounded-md flex items-center gap-3">
              <UserCheck className="h-4 w-4 text-green-600" />
              <div className="text-xs text-green-800">
                <span className="font-bold uppercase mr-2">Validated by Line 2:</span>
                "{control.line2Validation.comments}" ({new Date(control.line2Validation.validatedDate!).toLocaleDateString()})
              </div>
            </div>
          )}

          {remediationStatus && (
            <div className={cn(
              "mb-6 p-4 rounded-lg border flex items-start gap-3",
              remediationStatus.isReady ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'
            )}>
              <Clock className={cn("h-5 w-5", remediationStatus.isReady ? 'text-green-600' : 'text-amber-600')} />
              <div>
                <p className={cn(
                  "text-xs font-bold uppercase tracking-tight",
                  remediationStatus.isReady ? 'text-green-800' : 'text-amber-800'
                )}>
                  {t('badges.remediationReadiness')}
                </p>
                <p className={cn("text-sm", remediationStatus.isReady ? 'text-green-700' : 'text-amber-700')}>
                  {remediationStatus.message}
                </p>
              </div>
            </div>
          )}

          <Tabs defaultValue="tod" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tod">{t('tabs.tod')}</TabsTrigger>
              <TabsTrigger value="toe">{t('tabs.toe')}</TabsTrigger>
            </TabsList>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                  <TabsContent value="tod" className="pt-6 space-y-6">
                    <TODSixPillarForm form={form} t={t} />
                    
                    <div className="flex justify-end gap-2 mt-4">
                      <Button type="submit" disabled={isAuthenticating || mutation.isPending} onClick={() => { form.setValue('testType', 'TOD'); form.setValue('result', 'Ineffective'); }} variant="destructive" size="sm">
                        {isAuthenticating ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : <UserCheck className="h-4 w-4 mr-1"/>} {t('actions.ineffective')}
                      </Button>
                      <Button type="submit" disabled={isAuthenticating || mutation.isPending} onClick={() => { form.setValue('testType', 'TOD'); form.setValue('result', 'Effective'); }} className="bg-green-600 hover:bg-green-700" size="sm">
                        {isAuthenticating ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : <UserCheck className="h-4 w-4 mr-1"/>} {t('actions.effective')}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="toe" className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-4">
                        <div className={cn(
                          "p-3 rounded-md flex items-start gap-3 border transition-colors",
                          form.watch('sampleSize') !== undefined && form.watch('sampleSize')! < suggestion.min 
                            ? "bg-red-50 border-red-100" 
                            : "bg-blue-50 border-blue-100"
                        )}>
                          {form.watch('sampleSize') !== undefined && form.watch('sampleSize')! < suggestion.min ? (
                             <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                          ) : (
                             <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                          )}
                          <div className="space-y-1">
                            <p className={cn(
                              "text-xs font-bold uppercase leading-none",
                              form.watch('sampleSize') !== undefined && form.watch('sampleSize')! < suggestion.min ? "text-red-800" : "text-blue-800"
                            )}>
                              {form.watch('sampleSize') !== undefined && form.watch('sampleSize')! < suggestion.min 
                                ? t('validation.samplingViolation') 
                                : t('toe.suggestion')}
                            </p>
                            <p className={cn(
                              "text-xs",
                              form.watch('sampleSize') !== undefined && form.watch('sampleSize')! < suggestion.min ? "text-red-700" : "text-blue-700"
                            )}>
                              {form.watch('sampleSize') !== undefined && form.watch('sampleSize')! < suggestion.min 
                                ? t('validation.samplingWarning', { min: suggestion.min }) 
                                : `${t('toe.requiredSample')}: ${suggestion.label}`}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <FormField control={form.control} name="sampleSize" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs uppercase font-bold text-muted-foreground flex justify-between">
                                {t('toe.sampleSize')}
                                {field.value !== undefined && field.value < suggestion.min && (
                                  <Badge variant="destructive" className="text-xs h-3 px-1 animate-pulse">
                                    {t('toe.belowMin')}
                                  </Badge>
                                )}
                              </FormLabel>
                              <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} className={cn("h-8 text-xs", field.value !== undefined && field.value < suggestion.min && "border-red-500 bg-red-50")} /></FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )} />
                        </div>

                        <FormField control={form.control} name="homogeneityJustification" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1">
                              {t('toe.homogeneity')}
                              {form.watch('sampleSize')! < suggestion.min && <span className="text-red-500 font-bold">*</span>}
                            </FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className={cn(
                                  "h-16 text-xs",
                                  form.watch('sampleSize')! < suggestion.min && !field.value && "border-red-300 ring-red-100"
                                )} 
                                placeholder={t('toe.homogeneityPlaceholder')}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="method" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs font-bold uppercase text-muted-foreground">{t('actions.method')}</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Inquiry">Inquiry</SelectItem><SelectItem value="Observation">Observation</SelectItem><SelectItem value="Inspection">Inspection</SelectItem><SelectItem value="Reperformance">Reperformance</SelectItem></SelectContent></Select></FormItem>
                      )} />
                    </div>

                    <RegulatorySamplingTable control={form.control} t={t} />

                    <FormField control={form.control} name="comments" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs font-bold uppercase text-muted-foreground">{t('toe.comments')}</FormLabel><FormControl><Textarea placeholder={t('toe.placeholder')} {...field} className="min-h-[100px] text-xs" /></FormControl><FormMessage /></FormItem>
                    )} />

                    <div className="flex justify-end gap-2 mt-4">
                      <Button type="submit" disabled={isAuthenticating || mutation.isPending} onClick={() => { form.setValue('testType', 'TOE'); form.setValue('result', 'Ineffective'); }} variant="destructive" size="sm">
                        {isAuthenticating ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : <UserCheck className="h-4 w-4 mr-1"/>} {t('actions.ineffective')}
                      </Button>
                      <Button type="submit" disabled={isAuthenticating || mutation.isPending} onClick={() => { form.setValue('testType', 'TOE'); form.setValue('result', 'Effective'); }} className="bg-green-600 hover:bg-green-700" size="sm">
                        {isAuthenticating ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : <UserCheck className="h-4 w-4 mr-1"/>} {t('actions.effective')}
                      </Button>
                    </div>
                  </TabsContent>
                </motion.div>
              </form>
            </Form>
          </Tabs>

        </CardContent>
      </Card>

      <ControlHistory history={history} />
      
      <UnsavedChangesDialog blocker={blocker as any} />
    </div>
  );
}
