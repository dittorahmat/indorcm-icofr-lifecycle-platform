import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Info, ShieldAlert, CheckCircle2 } from 'lucide-react';

const formSchema = z.object({
  // Identity
  mappingId: z.string(),
  processName: z.string().nullable().optional(),
  subProcessName: z.string().nullable().optional(),
  fsliName: z.string().nullable().optional(),
  noGL: z.string().nullable().optional(),
  bpmCode: z.string().nullable().optional(),
  
  // Risk & Control
  riskDescription: z.string().nullable().optional(),
  isFraudRelated: z.boolean(),
  riskRating: z.string().nullable().optional(),
  controlCode: z.string().nullable().optional(),
  mappedControlName: z.string().min(1, "Nama kontrol wajib diisi"),
  mappedControlDescription: z.string().nullable().optional(),
  supportingDocs: z.string().nullable().optional(),
  isKeyControl: z.boolean(),
  controlType: z.string().nullable().optional(),
  controlNature: z.string().nullable().optional(),
  automatedSubNature: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  supportingApp: z.string().nullable().optional(),
  executingFunction: z.string().nullable().optional(),
  executorRole: z.string().nullable().optional(),
  affectedFsliItem: z.string().nullable().optional(),
  effectivePeriod: z.string().nullable().optional(),

  // Compliance (IPO)
  ipoC: z.boolean(),
  ipoA: z.boolean(),
  ipoV: z.boolean(),
  ipoRa: z.boolean(),

  // Compliance (Assertions)
  assertionE: z.boolean(),
  assertionC: z.boolean(),
  assertionA: z.boolean(),
  assertionCo: z.boolean(),
  assertionVa: z.boolean(),
  assertionRo: z.boolean(),
  assertionPd: z.boolean(),
  
  // ITGC specific
  itgcDomain: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RCMEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any;
  onSave: (values: FormValues) => void;
  isSaving?: boolean;
}

export function RCMEditDialog({ open, onOpenChange, data, onSave, isSaving }: RCMEditDialogProps) {
  const { t } = useTranslation('rcm');
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mappingId: '',
      isFraudRelated: false,
      isKeyControl: false,
      ipoC: false,
      ipoA: false,
      ipoV: false,
      ipoRa: false,
      assertionE: false,
      assertionC: false,
      assertionA: false,
      assertionCo: false,
      assertionVa: false,
      assertionRo: false,
      assertionPd: false,
    },
  });

  // Reset form when data changes
  React.useEffect(() => {
    if (data && open) {
      form.reset({
        ...data,
        isFraudRelated: !!data.isFraudRelated,
        isKeyControl: !!data.isKeyControl,
        ipoC: !!data.ipoC,
        ipoA: !!data.ipoA,
        ipoV: !!data.ipoV,
        ipoRa: !!data.ipoRa,
        assertionE: !!data.assertionE,
        assertionC: !!data.assertionC,
        assertionA: !!data.assertionA,
        assertionCo: !!data.assertionCo,
        assertionVa: !!data.assertionVa,
        assertionRo: !!data.assertionRo,
        assertionPd: !!data.assertionPd,
      });
    }
  }, [data, open, form]);

  const blocker = useUnsavedChanges(form.formState.isDirty && open);

  const handleSubmit = (values: FormValues) => {
    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
       if (!val && form.formState.isDirty) {
         // Blocker will handle this via UnsavedChangesDialog usually
         // but we respect the Dialog's own close behavior
         if (confirm(t('matrix.properties.warnings.unsaved_changes'))) {
           onOpenChange(false);
         }
       } else {
         onOpenChange(val);
       }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-slate-300 shadow-2xl">
        <DialogHeader className="p-6 pb-2 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-100">
                <ShieldAlert className="h-5 w-5" />
             </div>
             <div>
                <DialogTitle className="text-xl font-black tracking-tight text-slate-900">
                  {t('matrix.control_name')}: {data?.controlCode || '-'}
                </DialogTitle>
                <DialogDescription className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-0.5">
                  Standardized Auditor Workbench - SK-5 Regulatory Compliance
                </DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <Tabs defaultValue="general" className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 bg-slate-50 border-b border-slate-200">
                <TabsList className="bg-transparent h-12 p-0 gap-8 justify-start">
                  <TabsTrigger 
                    value="general" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 font-black uppercase text-xs tracking-wider"
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
                </TabsList>
              </div>

              <ScrollArea className="flex-1 p-6">
                {/* General Info Tab */}
                <TabsContent value="general" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="processName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.process_info')}</FormLabel>
                              <FormControl><Input {...field} readOnly className="bg-slate-50 border-slate-200 text-xs font-semibold text-slate-700" /></FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="subProcessName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.sub_process')}</FormLabel>
                              <FormControl><Input {...field} readOnly className="bg-slate-50 border-slate-200 text-xs font-semibold text-slate-700" /></FormControl>
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
                              <FormLabel className="text-xs font-black uppercase text-slate-400">Financial Item (FSLI)</FormLabel>
                              <FormControl><Input {...field} readOnly className="bg-slate-50 border-slate-200 text-xs font-semibold text-slate-700" /></FormControl>
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                           <FormField
                            control={form.control}
                            name="noGL"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase text-slate-400">No GL</FormLabel>
                                <FormControl><Input {...field} readOnly className="bg-slate-50 border-slate-200 text-xs font-mono font-bold text-indigo-700" /></FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="bpmCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase text-slate-400">BPM Code</FormLabel>
                                <FormControl><Input {...field} readOnly className="bg-slate-50 border-slate-200 text-xs font-mono font-bold text-indigo-700" /></FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                   </div>
                   
                   <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                      <div className="bg-white p-1.5 rounded-full shadow-sm">
                         <Info className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                         <p className="text-xs font-bold text-indigo-900 leading-tight">Regulatory Context</p>
                         <p className="text-xs text-indigo-700 mt-1 leading-relaxed opacity-80">
                           Data Identitas Proses di atas bersifat read-only dan ditarik langsung dari master data Business Process Mapping (BPM) untuk menjaga integritas audit trail.
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
                              <FormControl><Textarea {...field} rows={3} className="text-xs border-slate-200 focus:border-indigo-300 transition-all leading-normal" /></FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="col-span-6 space-y-4">
                        <FormField
                          control={form.control}
                          name="mappedControlName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.control_name')}</FormLabel>
                              <FormControl><Input {...field} className="text-xs border-slate-200 font-bold" /></FormControl>
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
                              <FormControl><Textarea {...field} rows={5} className="text-xs border-slate-200 leading-relaxed italic" /></FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-6 space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                           <FormField
                              control={form.control}
                              name="riskRating"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.risk_rating')}</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="text-xs h-9 border-slate-200"><SelectValue /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="High" className="text-xs text-rose-600 font-bold">High</SelectItem>
                                      <SelectItem value="Medium" className="text-xs text-amber-600 font-bold">Medium</SelectItem>
                                      <SelectItem value="Low" className="text-xs text-emerald-600 font-bold">Low</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="isFraudRelated"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-200 p-2 h-9 bg-white mt-auto">
                                  <FormLabel className="text-xs font-black uppercase text-slate-400 mb-0">{t('matrix.is_fraud')}</FormLabel>
                                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                              )}
                            />
                         </div>

                         <div className="grid grid-cols-2 gap-4 pt-2">
                           <FormField
                              control={form.control}
                              name="controlType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.type')}</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="text-xs h-9 border-slate-200"><SelectValue /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Preventive" className="text-xs">Preventive</SelectItem>
                                      <SelectItem value="Detective" className="text-xs">Detective</SelectItem>
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
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="text-xs h-9 border-slate-200"><SelectValue /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Manual" className="text-xs">Manual</SelectItem>
                                      <SelectItem value="Automated" className="text-xs">Automated</SelectItem>
                                      <SelectItem value="ITDM - IPE" className="text-xs">ITDM - IPE</SelectItem>
                                      <SelectItem value="ITDM - EUC" className="text-xs">ITDM - EUC</SelectItem>
                                      <SelectItem value="MRC" className="text-xs">MRC</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                         </div>
                         
                         <FormField
                            control={form.control}
                            name="frequency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.frequency')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="text-xs h-9 border-slate-200"><SelectValue /></SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Annual" className="text-xs">Annual</SelectItem>
                                    <SelectItem value="Semi-Annual" className="text-xs">Semi-Annual</SelectItem>
                                    <SelectItem value="Quarterly" className="text-xs">Quarterly</SelectItem>
                                    <SelectItem value="Monthly" className="text-xs">Monthly</SelectItem>
                                    <SelectItem value="Weekly" className="text-xs">Weekly</SelectItem>
                                    <SelectItem value="Daily" className="text-xs">Daily</SelectItem>
                                    <SelectItem value="Ad-hoc" className="text-xs">Ad-hoc</SelectItem>
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
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                         <Badge className="bg-blue-600 text-xs font-black">IPO</Badge>
                         <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">{t('matrix.ipo')}</h3>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                         {[
                           { name: 'ipoC', label: 'C', desc: 'Completeness' },
                           { name: 'ipoA', label: 'A', desc: 'Accuracy' },
                           { name: 'ipoV', label: 'V', desc: 'Validity' },
                           { name: 'ipoRa', label: 'RA', desc: 'Restricted Access' }
                         ].map(item => (
                           <FormField
                            key={item.name}
                            control={form.control}
                            name={item.name as any}
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-3 space-y-0 rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-blue-50/30 transition-colors">
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <div className="leading-none">
                                   <FormLabel className="text-xs font-black text-blue-700">{item.label}</FormLabel>
                                   <p className="text-xs text-slate-400 font-bold uppercase mt-1">{item.desc}</p>
                                </div>
                              </FormItem>
                            )}
                          />
                         ))}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                         <Badge className="bg-indigo-600 text-xs font-black">ASERSi</Badge>
                         <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">{t('matrix.assertions')}</h3>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                         {[
                           { name: 'assertionE', label: 'E/O', desc: 'Existence' },
                           { name: 'assertionC', label: 'C', desc: 'Completeness' },
                           { name: 'assertionA', label: 'A', desc: 'Accuracy' },
                           { name: 'assertionCo', label: 'CO', desc: 'Cut-off' },
                           { name: 'assertionVa', label: 'V/A', desc: 'Valuation' },
                           { name: 'assertionRo', label: 'R&O', desc: 'Rights & Oblig.' },
                           { name: 'assertionPd', label: 'PD', desc: 'Presentation' }
                         ].map(item => (
                           <FormField
                            key={item.name}
                            control={form.control}
                            name={item.name as any}
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-3 space-y-0 rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-indigo-50/30 transition-colors">
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <div className="leading-none">
                                   <FormLabel className="text-xs font-black text-indigo-700">{item.label}</FormLabel>
                                   <p className="text-xs text-slate-400 font-bold uppercase mt-1">{item.desc}</p>
                                </div>
                              </FormItem>
                            )}
                          />
                         ))}
                      </div>
                   </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <DialogFooter className="p-6 bg-slate-50 border-t border-slate-200">
               <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {form.formState.isDirty && (
                      <Badge variant="outline" className="animate-pulse bg-amber-50 text-amber-600 border-amber-200 font-black text-xs uppercase px-2 py-1">
                        Unsaved Changes
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-xs font-bold px-6">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving || !form.formState.isDirty} className="h-9 bg-indigo-600 hover:bg-indigo-700 text-xs font-black px-8 shadow-lg shadow-indigo-100">
                      {isSaving ? "Saving..." : "Update Mapping"}
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
