import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { getSuggestedSampleRange, isReadyForRemediationTest } from '@/lib/compliance-utils';
import type { Control, TestRecord, Deficiency, User } from '@shared/types';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { AlertTriangle, Info, Clock } from 'lucide-react';

const testSchema = z.object({
  testType: z.enum(['TOD', 'TOE']),
  method: z.enum(["Inquiry", "Observation", "Inspection", "Reperformance"]),
  result: z.enum(['Pass', 'Fail']),
  comments: z.string().min(1, 'Comments are required'),
  sampleSize: z.number().optional(),
  homogeneityJustification: z.string().optional(),
  evaluationAttributes: z.object({
    objectiveAchieved: z.boolean().default(true),
    timingAccuracy: z.boolean().default(true),
    authorityCompetence: z.boolean().default(true),
    infoReliability: z.boolean().default(true),
    periodCoverage: z.boolean().default(true),
    evidenceAvailability: z.boolean().default(true),
  })
});

function ControlTestCard({ control, openDeficiencyDate }: { control: Control, openDeficiencyDate?: number }) {
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof testSchema>>({
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
      }
    }
  });

  const suggestion = getSuggestedSampleRange(control.frequency, control.riskRating, control.nature);
  const remediationStatus = openDeficiencyDate ? isReadyForRemediationTest(control.frequency, openDeficiencyDate) : null;

  const mutation = useMutation({
    mutationFn: (data: Omit<TestRecord, 'id' | 'testDate' | 'testedBy'>) => api('/api/tests', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (data: TestRecord) => {
      toast.success(`${data.testType} for ${control.name} submitted.`);
      if (data.result === 'Fail') {
        queryClient.invalidateQueries({ queryKey: ['deficiencies'] });
      }
      form.reset();
    },
    onError: (error) => {
      toast.error(`Submission failed: ${error.message}`);
    },
  });

  function onSubmit(values: z.infer<typeof testSchema>) {
    if (values.testType === 'TOE' && !values.homogeneityJustification) {
      form.setError('homogeneityJustification', { type: 'manual', message: 'Justifikasi homogenitas wajib diisi untuk TOE (Bab V 1.3.a)' });
      return;
    }
    mutation.mutate({
      controlId: control.id,
      ...values,
    });
  }

  const EvaluationAttributesSection = () => (
    <div className="p-4 bg-muted/20 border rounded-lg space-y-3">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Atribut Evaluasi (Mandatori Tabel 21)</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        <FormField
          control={form.control}
          name="evaluationAttributes.objectiveAchieved"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              <FormLabel className="text-[11px] font-normal leading-none cursor-pointer">Pencapaian Objektif Kontrol</FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="evaluationAttributes.timingAccuracy"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              <FormLabel className="text-[11px] font-normal leading-none cursor-pointer">Ketepatan Waktu Pelaksanaan</FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="evaluationAttributes.authorityCompetence"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              <FormLabel className="text-[11px] font-normal leading-none cursor-pointer">Wewenang & Kompetensi Pelaksana</FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="evaluationAttributes.infoReliability"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              <FormLabel className="text-[11px] font-normal leading-none cursor-pointer">Keandalan Informasi (IPE/EUC)</FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="evaluationAttributes.periodCoverage"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              <FormLabel className="text-[11px] font-normal leading-none cursor-pointer">Cakupan Periode Pengujian</FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="evaluationAttributes.evidenceAvailability"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              <FormLabel className="text-[11px] font-normal leading-none cursor-pointer">Kecukupan Bukti Pendukung</FormLabel>
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30 border-b">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{control.code}: {control.name}</CardTitle>
            <CardDescription className="text-xs">{control.description}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
             <Badge variant="outline" className="text-[10px]">{control.frequency}</Badge>
             <Badge 
                variant="secondary" 
                className={cn(
                  "text-[10px] uppercase font-bold",
                  control.riskRating === 'High' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                )}
              >
                {control.riskRating} RISK
              </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
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
                Remediation Testing Readiness (Table 23)
              </p>
              <p className={cn("text-sm", remediationStatus.isReady ? 'text-green-700' : 'text-amber-700')}>
                {remediationStatus.message}
              </p>
            </div>
          </div>
        )}

        <Tabs defaultValue="tod" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tod">Test of Design (TOD)</TabsTrigger>
            <TabsTrigger value="toe">Test of Effectiveness (TOE)</TabsTrigger>
          </TabsList>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <TabsContent value="tod" className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm">Design Checklist</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2"><Checkbox id={`tod1-${control.id}`} /><Label htmlFor={`tod1-${control.id}`} className="text-xs">Is the control designed to prevent/detect the risk?</Label></div>
                        <div className="flex items-center space-x-2"><Checkbox id={`tod2-${control.id}`} /><Label htmlFor={`tod2-${control.id}`} className="text-xs">Is there a clear segregation of duties?</Label></div>
                      </div>

                      {control.nature === "ITDM - IPE" && (
                        <div className="p-3 bg-orange-50 border border-orange-100 rounded-md space-y-2">
                          <p className="text-[10px] font-bold text-orange-800 uppercase">Table 15 & 20: IPE Verifications ({control.ipeType})</p>
                          <div className="flex items-center space-x-2"><Checkbox id={`ipe1-${control.id}`} /><Label htmlFor={`ipe1-${control.id}`} className="text-[10px]">Verify report parameters & filters match design</Label></div>
                          {control.ipeType === "Query" && (
                            <>
                              <div className="flex items-center space-x-2"><Checkbox id={`ipeq-${control.id}`} /><Label htmlFor={`ipeq-${control.id}`} className="text-[10px] text-red-700 font-semibold">Technical Reperformance of SQL Logic (Query Validation)</Label></div>
                              <div className="flex items-center space-x-2"><Checkbox id={`ipet-${control.id}`} /><Label htmlFor={`ipet-${control.id}`} className="text-[10px]">Compare total rows/values with source data (Completeness)</Label></div>
                            </>
                          )}
                          <div className="flex items-center space-x-2"><Checkbox id={`ipe2-${control.id}`} /><Label htmlFor={`ipe2-${control.id}`} className="text-[10px]">Ensure source ITGCs are effective</Label></div>
                        </div>
                      )}

                      {control.nature === "ITDM - EUC" && (
                        <div className="p-3 bg-purple-50 border border-purple-100 rounded-md space-y-2">
                          <p className="text-[10px] font-bold text-purple-800 uppercase">Table 14: EUC Controls ({control.eucComplexity} Complexity)</p>
                          <div className="flex items-center space-x-2"><Checkbox id={`euc1-${control.id}`} /><Label htmlFor={`euc1-${control.id}`} className="text-[10px]">Data Integrity (Formula cells locked)</Label></div>
                          <div className="flex items-center space-x-2"><Checkbox id={`eucav-${control.id}`} /><Label htmlFor={`eucav-${control.id}`} className="text-[10px]">Availability (Periodic backup & restore test)</Label></div>
                          {(control.eucComplexity === "Medium" || control.eucComplexity === "High") && (
                            <>
                              <div className="flex items-center space-x-2"><Checkbox id={`eucv-${control.id}`} /><Label htmlFor={`eucv-${control.id}`} className="text-[10px]">Version Control (Current template used)</Label></div>
                              <div className="flex items-center space-x-2"><Checkbox id={`euca-${control.id}`} /><Label htmlFor={`euca-${control.id}`} className="text-[10px]">Access Control Validation (Password protected)</Label></div>
                            </>
                          )}
                          {control.eucComplexity === "High" && (
                            <div className="flex items-center space-x-2"><Checkbox id={`eucch-${control.id}`} /><Label htmlFor={`eucch-${control.id}`} className="text-[10px]">Change Control Documentation Review</Label></div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <FormField control={form.control} name="method" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">Testing Method</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Inquiry">Inquiry</SelectItem><SelectItem value="Observation">Observation</SelectItem><SelectItem value="Inspection">Inspection</SelectItem><SelectItem value="Reperformance">Reperformance</SelectItem></SelectContent></Select></FormItem>
                    )} />
                  </div>
                  
                  <EvaluationAttributesSection />
                  
                  <FormField control={form.control} name="comments" render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">TOD Comments</FormLabel><FormControl><Textarea placeholder="Enter TOD results and walkthrough notes..." {...field} className="min-h-[100px] text-xs" /></FormControl><FormMessage /></FormItem>
                  )} />
                  
                  <div className="flex justify-end gap-2 mt-4">
                    <Button type="submit" onClick={() => { form.setValue('testType', 'TOD'); form.setValue('result', 'Fail'); }} variant="destructive" size="sm">Fail TOD</Button>
                    <Button type="submit" onClick={() => { form.setValue('testType', 'TOD'); form.setValue('result', 'Pass'); }} size="sm">Pass TOD</Button>
                  </div>
                </TabsContent>

                <TabsContent value="toe" className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm">Sampling Details</h3>
                      
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-md flex items-start gap-3">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-blue-800 uppercase leading-none">SK-5 Table 22 Suggestion</p>
                          <p className="text-xs text-blue-700">Required Sample: <span className="font-bold">{suggestion.label}</span></p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1"><Label htmlFor={`pop-${control.id}`} className="text-[10px] uppercase font-bold text-muted-foreground">Population</Label><Input id={`pop-${control.id}`} type="number" defaultValue="250" className="h-8 text-xs" /></div>
                        <FormField control={form.control} name="sampleSize" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Sample Size</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} className="h-8 text-xs" /></FormControl></FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="homogeneityJustification" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Justifikasi Homogenitas (Wajib Bab V 1.3.a)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="h-16 text-xs" 
                              placeholder="Jelaskan alasan populasi dianggap homogen (e.g. kesamaan sistem, personil, SOP)..." 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="method" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">Testing Method</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Inquiry">Inquiry</SelectItem><SelectItem value="Observation">Observation</SelectItem><SelectItem value="Inspection">Inspection</SelectItem><SelectItem value="Reperformance">Reperformance</SelectItem></SelectContent></Select></FormItem>
                    )} />
                  </div>

                  <EvaluationAttributesSection />

                  <FormField control={form.control} name="comments" render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">TOE Comments</FormLabel><FormControl><Textarea placeholder="Enter TOE results, sample details, and deviations..." {...field} className="min-h-[100px] text-xs" /></FormControl><FormMessage /></FormItem>
                  )} />

                  <div className="flex justify-end gap-2 mt-4">
                    <Button type="submit" onClick={() => { form.setValue('testType', 'TOE'); form.setValue('result', 'Fail'); }} variant="destructive" size="sm">Fail TOE</Button>
                    <Button type="submit" onClick={() => { form.setValue('testType', 'TOE'); form.setValue('result', 'Pass'); }} size="sm">Pass TOE</Button>
                  </div>
                </TabsContent>
              </motion.div>
            </form>
          </Form>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function TestWorkbench() {
  const { data: controlsData, isLoading: controlsLoading } = useQuery({
    queryKey: ['controls'],
    queryFn: () => api<{ items: Control[] }>('/api/controls'),
  });

  const { data: deficienciesData, isLoading: deficienciesLoading } = useQuery({
    queryKey: ['deficiencies'],
    queryFn: () => api<{ items: Deficiency[] }>('/api/deficiencies'),
  });

  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api<User>('/api/users/me'),
  });

  const mockRole = localStorage.getItem('mockRole') || 'Line 1';

  // Bab II poin d.2 - Cooling Off Period Validation
  const isCoolingOffViolation = (control: Control) => {
    if (!userData?.processOwnershipHistory) return false;
    const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
    return userData.processOwnershipHistory.some(h => 
      h.processId === control.rcmId && 
      (h.role === 'Line 1' || h.role === 'Line 2') && 
      h.endDate > oneYearAgo
    );
  };

  if (mockRole !== 'Line 3') {
    return (
      <AppLayout container>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center flex flex-col items-center gap-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
              <h2 className="text-2xl font-bold">Access Denied</h2>
              <p className="text-muted-foreground">This workbench is only available to Internal Audit (Line 3).</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const isLoading = controlsLoading || deficienciesLoading;

  return (
    <AppLayout container>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Testing Workbench</h1>
          <p className="text-muted-foreground">Perform TOD and TOE for in-scope controls.</p>
        </div>
        
        <Accordion type="single" collapsible className="w-full space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          ) : (
            controlsData?.items.map(control => {
              const latestOpenDeficiency = deficienciesData?.items
                .filter(d => d.controlId === control.id && d.status === 'Open')
                .sort((a, b) => b.identifiedDate - a.identifiedDate)[0];

              const violation = isCoolingOffViolation(control);

              return (
                <AccordionItem value={control.id} key={control.id} className="border-none">
                  <AccordionTrigger className={cn(
                    "bg-background p-4 rounded-lg hover:bg-accent transition-colors shadow-sm",
                    violation && "opacity-60 cursor-not-allowed grayscale"
                  )}>
                    <div className="flex items-center gap-3 text-left">
                      <span className="font-semibold">{control.name}</span>
                      {latestOpenDeficiency && <Badge variant="destructive" className="text-[8px] h-4">OPEN DEFICIENCY</Badge>}
                      {violation && (
                        <Badge variant="outline" className="text-[8px] h-4 border-amber-500 text-amber-700 bg-amber-50 gap-1">
                          <AlertTriangle className="h-2 w-2" /> COOLING-OFF VIOLATION (BAB II)
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    {violation ? (
                      <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg text-center">
                        <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                        <h4 className="font-bold text-amber-800">Akses Dibatasi (Bab II poin d.2)</h4>
                        <p className="text-xs text-amber-700 max-w-md mx-auto mt-1 leading-relaxed">
                          Sesuai regulasi, Auditor Internal dilarang menguji aktivitas yang sebelumnya menjadi tanggung jawabnya (sebagai Lini 1 atau Lini 2) sebelum melewati periode pendinginan (cooling-off) minimal 12 bulan.
                        </p>
                      </div>
                    ) : (
                      <ControlTestCard 
                        control={control} 
                        openDeficiencyDate={latestOpenDeficiency?.identifiedDate}
                      />
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })
          )}
        </Accordion>
      </div>
    </AppLayout>
  );
}