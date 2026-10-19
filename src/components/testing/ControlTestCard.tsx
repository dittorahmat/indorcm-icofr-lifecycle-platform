import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { getSuggestedSampleRange } from '@/lib/compliance-utils';
import { normalizeTestingControl } from '@shared/testing-decision';
import type { Control, TestRecord } from '@shared/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, Loader2, ShieldCheck, Target } from 'lucide-react';
import { promptBiometricAuth } from '@/lib/forensic-utils';
import { ControlHistory } from './ControlHistory';
import { TODSixPillarForm } from './TODSixPillarForm';
import { TOETabContent } from './TOETabContent';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { testSchema, TestFormValues } from './test-schema';
import { evaluateTestSubmission, getRemediationReadiness } from './testing-compliance-engine';
import { riskRatingTone, type RiskRatingTone } from '@/lib/badge-tone';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';

/** Solid rating treatment for the test card header (the only solid surface). */
const RISK_RATING_SOLID_CLASS: Record<RiskRatingTone, string> = {
  high: 'bg-rose-500 text-white',
  medium: 'bg-amber-500 text-white',
  low: 'bg-emerald-500 text-white',
};

interface ControlTestCardProps {
  control: Control;
  openDeficiencyDate?: number;
  history: TestRecord[];
}

export function ControlTestCard({ control, openDeficiencyDate, history }: ControlTestCardProps) {
  const { t } = useTranslation('testing');
  const queryClient = useQueryClient();
  const { workingYear } = useFiscalYearStore();
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  
  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema) as any,
    defaultValues: {
      testType: "TOD",
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

  const normalizedControl = normalizeTestingControl({
    frequency: control.frequency,
    riskRating: control.riskRating,
    nature: control.nature,
  });
  const suggestion = getSuggestedSampleRange(
    normalizedControl?.frequency ?? 'Annual',
    normalizedControl?.riskRating ?? 'Low',
    normalizedControl?.nature ?? '',
  );

  const remediationStatus = getRemediationReadiness(control, openDeficiencyDate);

  const mutation = useMutation({
    mutationFn: (data: Omit<TestRecord, 'id' | 'testDate' | 'testedBy'>) => 
      api<TestRecord>('/api/tests', { method: 'POST', body: JSON.stringify(data) }),
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
    const evaluation = evaluateTestSubmission(control, values);
    if (!evaluation.isValid && evaluation.fieldError) {
      form.setError(evaluation.fieldError.field, {
        type: 'manual',
        message: t(evaluation.fieldError.messageKey)
      });
      return;
    }

    if (evaluation.computedResult) {
      values.result = evaluation.computedResult;
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
      period: control.year ? String(control.year) : (workingYear ? String(workingYear) : new Date().getFullYear().toString()),
      ...values,
    } as any);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
      <Card className="overflow-hidden lg:col-span-3 border-slate-200 shadow-sm rounded-lg">
        <CardHeader className="bg-slate-50/50 border-b py-4 sm:py-6 px-4 sm:px-8">
          <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-start justify-between gap-3 flex-wrap min-w-0">
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
                RISK_RATING_SOLID_CLASS[riskRatingTone(control.riskRating)]
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

          <Tabs
            defaultValue="tod"
            className="w-full"
            onValueChange={(tab) =>
              form.setValue('testType', tab === 'toe' ? 'TOE' : 'TOD', {
                shouldValidate: false,
              })
            }
          >
            <div className="bg-slate-100/70 p-1 border border-slate-200 rounded-lg w-full sm:w-fit mb-6 sm:mb-8 overflow-x-auto max-w-full touch-pan-x overscroll-x-contain no-scrollbar">
              <TabsList className="bg-transparent h-auto p-0 flex gap-1 w-max min-w-full sm:w-auto">
                <TabsTrigger 
                  value="tod" 
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-xs data-[state=active]:text-indigo-600 transition-all font-bold text-xs uppercase tracking-wider py-2 px-4 sm:px-6 text-slate-500 justify-center min-h-[44px] flex-1 sm:flex-none whitespace-nowrap"
                >
                  {t('tabs.tod')}
                </TabsTrigger>
                <TabsTrigger 
                  value="toe" 
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-xs data-[state=active]:text-indigo-600 transition-all font-bold text-xs uppercase tracking-wider py-2 px-4 sm:px-6 text-slate-500 justify-center min-h-[44px] flex-1 sm:flex-none whitespace-nowrap"
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
                    
                    <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 flex-wrap min-w-0">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-0">
                        <Target className="h-4 w-4 text-indigo-500 shrink-0" />
                        {t('actions.finalVerdict')}
                      </div>
                      <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto">
                        <Button 
                          type="submit" 
                          disabled={isAuthenticating || mutation.isPending} 
                          onClick={() => { form.setValue('testType', 'TOD'); form.setValue('result', 'Ineffective'); }} 
                          variant="outline" 
                          className="h-11 px-6 sm:px-8 rounded-lg font-bold text-xs uppercase tracking-wider border-rose-200 text-rose-600 hover:bg-rose-50 transition-all w-full sm:w-auto justify-center min-h-[44px]"
                        >
                          {isAuthenticating ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <AlertTriangle className="h-4 w-4 mr-2"/>} 
                          {t('actions.ineffective')}
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={isAuthenticating || mutation.isPending} 
                          onClick={() => { form.setValue('testType', 'TOD'); form.setValue('result', 'Effective'); }} 
                          className="h-11 px-6 sm:px-8 rounded-lg font-bold text-xs uppercase tracking-wider bg-mancity-pattern hover:opacity-90 shadow-sm transition-all text-primary-foreground w-full sm:w-auto justify-center min-h-[44px]"
                        >
                          {isAuthenticating ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <ShieldCheck className="h-4 w-4 mr-2"/>} 
                          {t('actions.effective')}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="toe" className="space-y-6 sm:space-y-8 m-0 outline-none">
                    <TOETabContent
                      control={control}
                      suggestion={suggestion}
                      isAuthenticating={isAuthenticating}
                      isPending={mutation.isPending}
                    />
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
