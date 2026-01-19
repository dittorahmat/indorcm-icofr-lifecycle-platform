import React from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { calculateRiskRating, COBIT_ITGC_MAPPING, getSuggestedControl } from '@/lib/compliance-utils';
import type { Control, ControlAssertion, InformationProcessingObjective, ControlFrequency, COSOPrinciple, ITGCArea, Application } from '@shared/types';
import { UploadCloud, File as FileIcon, X, Calculator, Wand2, Info, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const ALL_ASSERTIONS: ControlAssertion[] = ["Completeness", "Accuracy", "Validity", "Cut-off", "Presentation", "Existence"];
const ALL_IPOS: InformationProcessingObjective[] = ["Completeness", "Accuracy", "Validity", "Restricted Access"];
const ALL_FREQUENCIES: ControlFrequency[] = ["Annual", "Semi-Annual", "Quarterly", "Monthly", "Weekly", "Daily", "Ad-hoc"];
const ALL_COSO: COSOPrinciple[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const ITGC_AREAS: ITGCArea[] = ["Access to Program and Data", "Program Development", "Program Changes", "Computer Operations"];

interface QualitativeRiskWizardProps {
  onApply: (rating: "High" | "Medium" | "Low") => void;
}

function QualitativeRiskWizard({ onApply }: QualitativeRiskWizardProps) {
  const [factors, setFactors] = React.useState({
    inherentRisk: false, // a) Risiko bawaan akun/asersi
    volumeChanges: false, // b) Perubahan volume/sifat transaksi
    errorHistory: false, // c) Riwayat error
    elcWeakness: false, // d) Efektivitas ELC pemantau
    complexity: false, // e) Karakteristik/frekuensi pengendalian
    dependence: false, // f) Ketergantungan pada pengendalian lain
    personnelIssue: false, // g) Kompetensi/perubahan personil
    manualNature: false, // h) Bergantung pada kinerja individu (manual)
    highJudgement: false, // i) Kompleksitas judgement pelaksanaan
  });

  const count = Object.values(factors).filter(Boolean).length;
  // Calculation logic based on Table 11
  const suggestedRating: "High" | "Medium" | "Low" = count >= 6 ? "High" : count >= 3 ? "Medium" : "Low";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1">
          <Wand2 className="h-3 w-3" /> Wizard (Table 11)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <DialogHeader>
            <DialogTitle>Qualitative Risk Assessment Wizard</DialogTitle>
            <DialogDescription>
              Menentukan rating risiko kualitatif berdasarkan 9 kriteria mandatori Tabel 11 (Hal 27).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {[
              { id: 'inherentRisk', label: 'a) Risiko bawaan yang tinggi pada akun dan asersi terkait.' },
              { id: 'volumeChanges', label: 'b) Terjadi perubahan signifikan dalam volume atau sifat transaksi.' },
              { id: 'errorHistory', label: 'c) Terdapat riwayat error/salah saji pada pengendalian ini.' },
              { id: 'elcWeakness', label: 'd) Pengendalian tingkat entitas (ELC) pemantau kurang efektif.' },
              { id: 'complexity', label: 'e) Pengendalian memiliki karakteristik kompleks atau frekuensi rendah.' },
              { id: 'dependence', label: 'f) Sangat bergantung pada efektivitas pengendalian lain (ITGC/ELC).' },
              { id: 'personnelIssue', label: 'g) Terdapat isu kompetensi atau perubahan personil pelaksana.' },
              { id: 'manualNature', label: 'h) Pengendalian bersifat manual (bergantung pada kinerja individu).' },
              { id: 'highJudgement', label: 'i) Memerlukan judgement/pertimbangan profesional yang signifikan.' },
            ].map((item) => (
              <div key={item.id} className="flex items-start space-x-3 space-y-0 rounded-md border p-2 hover:bg-muted/50 transition-colors">
                <Checkbox 
                  id={item.id} 
                  checked={(factors as any)[item.id]} 
                  onCheckedChange={(checked) => setFactors({ ...factors, [item.id]: !!checked })} 
                />
                <Label htmlFor={item.id} className="text-[11px] font-normal leading-tight cursor-pointer">
                  {item.label}
                </Label>
              </div>
            ))}

            <div className={`mt-4 p-4 rounded-lg border flex items-center justify-between ${suggestedRating === 'Low' ? 'bg-green-50 border-green-200' : suggestedRating === 'Medium' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
               <div className="flex items-center gap-3">
                  <Info className={`h-5 w-5 ${suggestedRating === 'Low' ? 'text-green-600' : suggestedRating === 'Medium' ? 'text-amber-600' : 'text-red-600'}`} />
                  <div>
                     <p className="text-[10px] uppercase font-bold text-muted-foreground">Rating Kualitatif Disarankan</p>
                     <p className="text-2xl font-black tracking-tight uppercase">{suggestedRating}</p>
                  </div>
               </div>
               <Badge variant="outline" className="text-[10px]">Criteria met: {count}/9</Badge>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => onApply(suggestedRating)} className="w-full">Terapkan Rating</Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

const controlSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['Preventive', 'Detective']),
  nature: z.enum(['Manual', 'Automated', 'ITDM - IPE', 'ITDM - EUC', 'MRC']),
  automatedSubNature: z.enum(["Automated Control", "Automated Calculation", "Restricted Access", "Interface"]).optional(),
  itApplication: z.string().optional(), // New: Significant Application
  frequency: z.enum(["Annual", "Semi-Annual", "Quarterly", "Monthly", "Weekly", "Daily", "Ad-hoc"]),
  riskQuantitative: z.enum(['High', 'Medium', 'Low']).default('Low'),
  riskQualitative: z.enum(['High', 'Medium', 'Low']).default('Low'),
  assertions: z.array(z.string()).optional(),
  ipos: z.array(z.string()).optional(),
  cosoPrinciples: z.array(z.number()).min(1, 'At least one COSO principle is required'),
  itgcArea: z.string().optional(),
  cobitId: z.string().optional(),
  isFraudRisk: z.boolean().default(false),
  effectiveDate: z.string().default(new Date().toISOString().split('T')[0]),
  isKeyControl: z.boolean().default(false),
  eucComplexity: z.enum(['Low', 'Medium', 'High']).optional(),
  ipeType: z.enum(['Standard/Custom', 'Query']).optional(),
});

type ControlEditorProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  control: Partial<Control> | null;
};

export function ControlEditor({ isOpen, setIsOpen, control }: ControlEditorProps) {
  const queryClient = useQueryClient();
  const [evidenceFile, setEvidenceFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);

  const { data: applicationsData } = useQuery({
    queryKey: ['applications'],
    queryFn: () => api<{ items: Application[] }>('/api/applications'),
  });

  const form = useForm<z.infer<typeof controlSchema>>({
    resolver: zodResolver(controlSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      type: 'Preventive',
      nature: 'Manual',
      automatedSubNature: undefined,
      itApplication: '',
      frequency: 'Monthly',
      riskQuantitative: 'Low',
      riskQualitative: 'Low',
      assertions: [],
      ipos: [],
      cosoPrinciples: [],
      itgcArea: undefined,
      cobitId: '',
      isFraudRisk: false,
      effectiveDate: new Date().toISOString().split('T')[0],
      isKeyControl: false,
      eucComplexity: 'Low',
      ipeType: 'Standard/Custom',
    },
  });

  const { watch, setValue } = form;
  const quant = watch('riskQuantitative');
  const qual = watch('riskQualitative');
  const calculatedRating = calculateRiskRating(quant, qual);

  React.useEffect(() => {
    if (control) {
      form.reset({
        code: control.code || '',
        name: control.name || '',
        description: control.description || '',
        type: control.type || 'Preventive',
        nature: (control.nature as any) || 'Manual',
        automatedSubNature: control.automatedSubNature,
        itApplication: control.itApplication || '',
        frequency: control.frequency || 'Monthly',
        riskQuantitative: control.riskAssessment?.quantitativeScore || 'Low',
        riskQualitative: control.riskAssessment?.qualitativeScore || 'Low',
        assertions: control.assertions || [],
        ipos: control.ipos || [],
        cosoPrinciples: control.cosoPrinciples || [],
        itgcArea: control.itgcArea,
        cobitId: control.cobitId || '',
        isFraudRisk: control.isFraudRisk || false,
        effectiveDate: control.effectiveDate ? new Date(control.effectiveDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        isKeyControl: control.isKeyControl || false,
        eucComplexity: control.eucComplexity || 'Low',
        ipeType: control.ipeType || 'Standard/Custom',
      });
    }
  }, [control, form]);

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof controlSchema>) => {
      const payload: Partial<Control> = {
        ...values,
        effectiveDate: new Date(values.effectiveDate).getTime(),
        riskRating: calculatedRating,
        riskAssessment: {
          quantitativeScore: values.riskQuantitative,
          qualitativeScore: values.riskQualitative
        },
        assertions: values.assertions as ControlAssertion[],
        ipos: values.ipos as InformationProcessingObjective[],
        cosoPrinciples: values.cosoPrinciples as COSOPrinciple[],
        itgcArea: values.itgcArea as ITGCArea
      };
      const apiCall = control?.id
        ? api(`/api/controls/${control.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : api('/api/controls', { method: 'POST', body: JSON.stringify({ ...payload, rcmId: control?.rcmId }) });
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

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setEvidenceFile(file);
      setPreview('https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=800&auto=format&fit=crop');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  const onSubmit = (values: z.infer<typeof controlSchema>) => {
    mutation.mutate({ 
      ...values, 
      assertions: values.assertions as ControlAssertion[],
      ipos: values.ipos as InformationProcessingObjective[],
      cosoPrinciples: values.cosoPrinciples as COSOPrinciple[],
      itgcArea: values.itgcArea as ITGCArea
    });
  };

  const nature = form.watch('nature');

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          <SheetHeader>
            <SheetTitle>{control?.id ? 'Edit Control' : 'Add New Control'}</SheetTitle>
            <SheetDescription>Align this control with SK-5/DKU.MBU/11/2024 standards.</SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem><FormLabel>Control Code</FormLabel><FormControl><Input placeholder="e.g. P2P-01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Control Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="isKeyControl" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/20">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Key Control (Utama)</FormLabel>
                      <p className="text-[10px] text-muted-foreground italic">Crucial control.</p>
                    </div>
                  </FormItem>
                )} />

                <FormField control={form.control} name="isFraudRisk" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-red-50/30 border-red-100">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-red-800">Fraud Risk (Kecurangan)</FormLabel>
                      <p className="text-[10px] text-red-600 italic">Mitigates fraud risks (Tabel 18).</p>
                    </div>
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Preventive">Preventive</SelectItem><SelectItem value="Detective">Detective</SelectItem></SelectContent></Select></FormItem>
                )} />
                <FormField control={form.control} name="nature" render={({ field }) => (
                  <FormItem><FormLabel>Nature (Sifat Pelaksanaan)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Manual">Manual</SelectItem><SelectItem value="Automated">Otomatis</SelectItem><SelectItem value="ITDM - IPE">ITDM - IPE (Report)</SelectItem><SelectItem value="ITDM - EUC">ITDM - EUC (Spreadsheet)</SelectItem><SelectItem value="MRC">MRC (Management Review)</SelectItem></SelectContent></Select></FormItem>
                )} />
              </div>

              {nature === 'Automated' && (
                <FormField control={form.control} name="automatedSubNature" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub-Tipe Otomatis (Tabel 18)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Pilih sub-tipe..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Automated Control">Automated Control</SelectItem>
                        <SelectItem value="Automated Calculation">Automated Calculation</SelectItem>
                        <SelectItem value="Restricted Access">Restricted Access</SelectItem>
                        <SelectItem value="Interface">Interface</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              )}

              {(nature === 'Automated' || nature === 'ITDM - IPE' || nature === 'ITDM - EUC') && (
                <FormField control={form.control} name="itApplication" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aplikasi Signifikan (Bab III 1.5)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Pilih aplikasi..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        {applicationsData?.items.map(app => (
                          <SelectItem key={app.id} value={app.id}>
                            {app.name} 
                            {app.statusITGC === 'Ineffective' && ' (ITGC Issue!)'}
                          </SelectItem>
                        ))}
                        <SelectItem value="Other">Lainnya (Input Manual)</SelectItem>
                      </SelectContent>
                    </Select>
                    {field.value && applicationsData?.items.find(a => a.id === field.value)?.statusITGC === 'Ineffective' && (
                      <p className="text-[10px] text-red-600 font-bold mt-1">
                        Peringatan: ITGC pada aplikasi ini tidak efektif. Pertimbangkan kontrol kompensasi.
                      </p>
                    )}
                  </FormItem>
                )} />
              )}

              {nature !== 'Manual' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="itgcArea" render={({ field }) => (
                    <FormItem><FormLabel>ITGC Area</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select ITGC Area" /></SelectTrigger></FormControl><SelectContent>{ITGC_AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select></FormItem>
                  )} />
                  <FormField control={form.control} name="cobitId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>COBIT 2019 ID (Optional)</FormLabel>
                      <FormControl><Input placeholder="e.g. APO09" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                      {field.value && COBIT_ITGC_MAPPING[field.value] && form.watch('itgcArea') && !COBIT_ITGC_MAPPING[field.value].includes(form.watch('itgcArea') as string) && (
                        <p className="text-[10px] text-amber-600 font-bold mt-1">
                          Peringatan: Berdasarkan Tabel 1, {field.value} biasanya tidak dipetakan ke area {form.watch('itgcArea')}.
                        </p>
                      )}
                    </FormItem>
                  )} />
                </div>
              )}

              {/* SK-5 Precision: EUC Complexity & IPE Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nature === "ITDM - EUC" && (
                  <FormField control={form.control} name="eucComplexity" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kompleksitas Spreadsheet (Tabel 14)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Low">Low (Formula Sederhana)</SelectItem>
                          <SelectItem value="Medium">Medium (Antar Lembar Kerja)</SelectItem>
                          <SelectItem value="High">High (Macro/VBA/Kompleks)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                )}

                {nature === "ITDM - IPE" && (
                  <FormField control={form.control} name="ipeType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Laporan IPE (Tabel 20)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Standard/Custom">Standard/Custom System Report</SelectItem>
                          <SelectItem value="Query">Query/SQL Script</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                )}
              </div>

              {/* MRC Specific Metadata (Table 21) */}
              {nature === "MRC" && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-4">
                  <p className="text-[10px] font-bold text-orange-800 uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert className="h-3 w-3" /> Management Review Control Parameters (Table 21)
                  </p>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Management Expectation (Kewajaran Ekspektasi)</Label>
                      <Input className="h-8 text-xs" placeholder="e.g. Varians biaya operasional < 5% per bulan" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Investigation Threshold (Ambang Batas)</Label>
                      <Input className="h-8 text-xs" placeholder="e.g. Selisih absolut > Rp 50.000.000" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Investigation Procedures (Prosedur Tindak Lanjut)</Label>
                      <Textarea className="text-xs" placeholder="Langkah-langkah jika threshold terlampaui..." />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="effectiveDate" render={({ field }) => (
                  <FormItem><FormLabel>Effective Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="frequency" render={({ field }) => (
                  <FormItem><FormLabel>Frequency</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{ALL_FREQUENCIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></FormItem>
                )} />
              </div>

              <div className="space-y-4 rounded-md border p-4 bg-primary/5 border-primary/10">
                <Label className="flex items-center gap-2 text-[10px] font-bold uppercase text-primary">
                  <Calculator className="h-3 w-3" /> Calculated Risk
                </Label>
                <Badge 
                  variant="secondary" 
                  className={`${calculatedRating === 'High' ? 'bg-red-100 text-red-700' : calculatedRating === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'} text-xs px-3 w-full justify-center`}
                >
                  {calculatedRating} Risk
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <FormField control={form.control} name="riskQuantitative" render={({ field }) => (
                  <FormItem><FormLabel className="text-[10px] uppercase">Kuantitatif (Table 10)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="High">High (&gt;= OM)</SelectItem><SelectItem value="Medium">Medium (PM to OM)</SelectItem><SelectItem value="Low">Low (&lt; PM)</SelectItem></SelectContent></Select></FormItem>
                )} />
                <FormField control={form.control} name="riskQualitative" render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center mb-1">
                      <FormLabel className="text-[10px] uppercase">Kualitatif (Table 11)</FormLabel>
                      <QualitativeRiskWizard onApply={(val) => setValue("riskQualitative", val)} />
                    </div>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="High">High (Frequent)</SelectItem>
                        <SelectItem value="Medium">Medium (Possible)</SelectItem>
                        <SelectItem value="Low">Low (Rare)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>

              <div className="space-y-4 rounded-md border p-4">
                <Label className="text-xs font-bold uppercase tracking-wider text-primary">Regulatory Mapping</Label>
                
                <FormField control={form.control} name="cosoPrinciples" render={() => (
                  <FormItem>
                    <div className="flex justify-between items-center mb-1">
                      <FormLabel className="text-xs">COSO Principles (1-17)</FormLabel>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[9px] gap-1 text-primary"
                        onClick={() => {
                          const firstP = form.watch('cosoPrinciples')?.[0];
                          if (firstP) {
                            const suggestion = getSuggestedControl(firstP);
                            form.setValue('name', suggestion.name);
                            form.setValue('description', suggestion.description);
                            toast.info(`Template diterapkan berdasarkan Prinsip ${firstP}`);
                          } else {
                            toast.error("Pilih minimal satu Prinsip COSO untuk mendapatkan saran template.");
                          }
                        }}
                      >
                        <Lightbulb className="h-3 w-3" /> Suggest Template (Appx 1)
                      </Button>
                    </div>
                    <div className="grid grid-cols-6 gap-1 pt-2">
                      {ALL_COSO.map((p) => (
                        <FormField key={p} control={form.control} name="cosoPrinciples" render={({ field }) => (
                          <FormItem key={p} className="flex flex-col items-center space-y-1">
                            <FormControl><Checkbox checked={field.value?.includes(p)} onCheckedChange={(checked) => {
                              return checked ? field.onChange([...(field.value || []), p]) : field.onChange(field.value?.filter((v) => v !== p));
                            }} /></FormControl>
                            <span className="text-[10px] font-bold">{p}</span>
                          </FormItem>
                        )} />
                      ))}
                    </div>
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="assertions" render={() => (
                    <FormItem><FormLabel className="text-xs">Assertions</FormLabel>
                      <div className="space-y-1 pt-1">
                        {ALL_ASSERTIONS.map((item) => (
                          <FormField key={item} control={form.control} name="assertions" render={({ field }) => (
                            <FormItem key={item} className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {
                                return checked ? field.onChange([...(field.value || []), item]) : field.onChange(field.value?.filter((v) => v !== item));
                              }} /></FormControl>
                              <FormLabel className="font-normal text-[10px]">{item}</FormLabel>
                            </FormItem>
                          )} />
                        ))}
                      </div>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="ipos" render={() => (
                    <FormItem><FormLabel className="text-xs">IPOs</FormLabel>
                      <div className="space-y-1 pt-1">
                        {ALL_IPOS.map((item) => (
                          <FormField key={item} control={form.control} name="ipos" render={({ field }) => (
                            <FormItem key={item} className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {
                                return checked ? field.onChange([...(field.value || []), item]) : field.onChange(field.value?.filter((v) => v !== item));
                              }} /></FormControl>
                              <FormLabel className="font-normal text-[10px]">{item}</FormLabel>
                            </FormItem>
                          )} />
                        ))}
                      </div>
                    </FormItem>
                  )} />
                </div>
              </div>

              <div>
                <Label>BPM Artifacts (Flowchart/Narrative)</Label>
                {!evidenceFile ? (
                  <div {...getRootProps()} className={`mt-2 flex justify-center rounded-md border-2 border-dashed border-input px-6 pt-5 pb-6 cursor-pointer hover:border-primary ${isDragActive ? 'border-primary bg-accent' : ''}`}>
                    <input {...getInputProps()} />
                    <div className="space-y-1 text-center"><UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" /><p className="text-sm text-muted-foreground">Drag & drop or click to upload</p></div>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-between rounded-md border border-input p-3">
                    <div className="flex items-center gap-2">
                      {preview && <img src={preview} alt="preview" className="h-10 w-10 rounded object-cover" />}
                      <span className="text-sm font-medium">{evidenceFile.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setEvidenceFile(null); setPreview(null); }}><X className="h-4 w-4" /></Button>
                  </div>
                )}
              </div>

              <SheetFooter className="mt-8">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save Control'}</Button>
              </SheetFooter>
            </form>
          </Form>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
