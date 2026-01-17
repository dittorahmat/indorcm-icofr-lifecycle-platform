import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Materiality } from '@shared/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tabs, TabsContent, Select as SelectPrimitive, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Wand2, Info } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const materialitySchema = z.object({
  benchmark: z.enum(["Pre-Tax Income", "Revenue", "Assets", "Equity"]),
  benchmarkValue: z.number().min(0),
  percentage: z.number().min(0).max(100),
  haircut: z.number().min(0).max(100),
  locationCount: z.number().min(1).default(1),
});

type MaterialityForm = z.infer<typeof materialitySchema>;

/**
 * Get Multiplier based on Table 25 (Hal 104)
 */
function getGroupMultiplier(count: number): number {
  if (count <= 1) return 1;
  if (count === 2) return 1.5;
  if (count <= 4) return 2;
  if (count <= 6) return 2.5;
  if (count <= 9) return 3;
  if (count <= 14) return 3.5;
  if (count <= 19) return 4;
  if (count <= 25) return 4.5;
  if (count <= 30) return 5;
  if (count <= 40) return 5.5;
  if (count <= 50) return 6;
  if (count <= 64) return 6.5;
  if (count <= 80) return 7;
  if (count <= 94) return 7.5;
  if (count <= 110) return 8;
  if (count <= 130) return 8.5;
  return 9;
}

interface HaircutWizardProps {
  onApply: (value: number) => void;
}

function HaircutWizard({ onApply }: HaircutWizardProps) {
  const [factors, setFactors] = React.useState({
    pastAdjustments: false,
    complexOps: false,
    weakInternalControl: false,
    significantChanges: false,
    staffTurnover: false,
  });

  const riskScore = Object.values(factors).filter(Boolean).length;
  
  // Suggested haircut based on Table 4 logic
  // 0 factors: 25% (Low Risk)
  // 1-2 factors: 35-45% (Medium Risk)
  // 3+ factors: 55%+ (High Risk)
  const suggestedHaircut = riskScore === 0 ? 25 : riskScore <= 2 ? 45 : 55;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wand2 className="h-4 w-4" /> Determine Haircut (Table 4)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Haircut Determination Wizard</DialogTitle>
          <DialogDescription>
            Menentukan persentase haircut untuk Performance Materiality berdasarkan faktor kualitatif Tabel 4.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {[
            { id: 'pastAdjustments', label: 'Terdapat riwayat salah saji material atau audit adjustment signifikan dalam 2 tahun terakhir.' },
            { id: 'complexOps', label: 'Proses bisnis atau transaksi bersifat sangat kompleks/tidak rutin.' },
            { id: 'weakInternalControl', label: 'Ditemukan defisiensi signifikan/kelemahan material pada tahun sebelumnya.' },
            { id: 'significantChanges', label: 'Terdapat perubahan sistem akuntansi atau restrukturisasi organisasi yang masif.' },
            { id: 'staffTurnover', label: 'Tingkat turnover personil kunci di fungsi akuntansi/pelaporan cukup tinggi.' },
          ].map((item) => (
            <div key={item.id} className="flex items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-muted/50 transition-colors">
              <Checkbox 
                id={item.id} 
                checked={(factors as any)[item.id]} 
                onCheckedChange={(checked) => setFactors({ ...factors, [item.id]: !!checked })} 
              />
              <Label htmlFor={item.id} className="text-xs font-normal leading-tight cursor-pointer">
                {item.label}
              </Label>
            </div>
          ))}

          <div className={`mt-6 p-4 rounded-lg border flex items-center justify-between ${suggestedHaircut <= 25 ? 'bg-green-50 border-green-200' : suggestedHaircut <= 45 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
             <div className="flex items-center gap-3">
                <Info className={`h-5 w-5 ${suggestedHaircut <= 25 ? 'text-green-600' : suggestedHaircut <= 45 ? 'text-amber-600' : 'text-red-600'}`} />
                <div>
                   <p className="text-[10px] uppercase font-bold text-muted-foreground">Saran Haircut</p>
                   <p className="text-2xl font-black tracking-tight">{suggestedHaircut}%</p>
                </div>
             </div>
             <Badge variant="outline" className="uppercase text-[10px] font-bold">
                {suggestedHaircut <= 25 ? 'Low Risk' : suggestedHaircut <= 45 ? 'Medium Risk' : 'High Risk'}
             </Badge>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onApply(suggestedHaircut)} className="w-full">Terapkan Persentase</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ScopingPage() {
  const { data: materialityData, isLoading } = useQuery({
    queryKey: ['materiality'],
    queryFn: () => api<{ items: Materiality[] }>('/api/materiality'),
  });

  const currentMateriality = materialityData?.items?.[0];

  const { register, control, watch, handleSubmit, setValue } = useForm<MaterialityForm>({
    resolver: zodResolver(materialitySchema),
    defaultValues: {
      benchmark: "Pre-Tax Income",
      benchmarkValue: 0,
      percentage: 5,
      haircut: 25,
      locationCount: 1,
    }
  });

  const formValues = watch();
  
  const baseOM = (formValues.benchmarkValue * formValues.percentage) / 100;
  const multiplier = getGroupMultiplier(formValues.locationCount);
  const overallMateriality = baseOM * multiplier;
  const performanceMateriality = overallMateriality * (1 - formValues.haircut / 100);

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

  return (
    <AppLayout container>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Scoping & Materiality</h1>
          <p className="text-muted-foreground">Define materiality thresholds and scope significant accounts for ICOFR.</p>
        </div>

        <Tabs defaultValue="materiality">
          <TabsList>
            <TabsTrigger value="materiality">Materiality</TabsTrigger>
            <TabsTrigger value="scoping">Scoping</TabsTrigger>
          </TabsList>

          <TabsContent value="materiality" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Materiality Calculation</CardTitle>
                <CardDescription>Determine Overall Materiality (OM) and Performance Materiality (PM) based on financial benchmarks and group multiplier.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Benchmark Basis</Label>
                      <Controller
                        control={control}
                        name="benchmark"
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select benchmark" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pre-Tax Income">Pre-Tax Income (Laba Sebelum Pajak)</SelectItem>
                              <SelectItem value="Revenue">Revenue (Pendapatan)</SelectItem>
                              <SelectItem value="Assets">Total Assets (Total Aset)</SelectItem>
                              <SelectItem value="Equity">Total Equity (Total Ekuitas)</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Benchmark Value (IDR)</Label>
                      <Input 
                        type="number" 
                        {...register("benchmarkValue", { valueAsNumber: true })} 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Number of Significant Locations (Entities)</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          {...register("locationCount", { valueAsNumber: true })} 
                        />
                        <Badge variant="outline" className="bg-primary/5">Multiplier: {multiplier}x</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">Based on SK-5 Table 25 Multiplier</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Percentage (%)</Label>
                      <Input 
                        type="number" 
                        step="0.1"
                        {...register("percentage", { valueAsNumber: true })} 
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Haircut for PM (%)</Label>
                        <HaircutWizard onApply={(val) => setValue("haircut", val)} />
                      </div>
                      <Input 
                        type="number" 
                        step="1"
                        {...register("haircut", { valueAsNumber: true })} 
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-6 rounded-lg border-2 border-primary/10">
                    <div>
                      <h3 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
                        Overall Materiality (OM) 
                        {multiplier > 1 && <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-bold">GROUP</span>}
                      </h3>
                      <p className="text-3xl font-bold text-primary">{formatCurrency(overallMateriality)}</p>
                      {multiplier > 1 && <p className="text-[10px] text-muted-foreground mt-1">Base OM ({formatCurrency(baseOM)}) x Multiplier ({multiplier}x)</p>}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-muted-foreground">Performance Materiality (PM)</h3>
                      <p className="text-3xl font-bold text-primary">{formatCurrency(performanceMateriality)}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Tolerance for undetected errors ({(100 - formValues.haircut)}% of OM)</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="button">Save Calculation</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scoping" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Significant Accounts Matrix</CardTitle>
                  <CardDescription>Accounts flagged based on PM threshold: {formatCurrency(performanceMateriality)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account Name</TableHead>
                        <TableHead className="text-right">Balance (IDR)</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { name: "Kas & Bank", balance: 5000000000, reason: "> PM" },
                        { name: "Piutang Usaha", balance: 4200000000, reason: "> PM" },
                        { name: "Persediaan", balance: 3800000000, reason: "> PM" },
                        { name: "Aset Tetap", balance: 12000000000, reason: "> PM" },
                        { name: "Biaya Dibayar Dimuka", balance: 150000000, reason: "Qualitative (Risk)" },
                      ].map((acc, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{acc.name}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{formatCurrency(acc.balance)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{acc.reason}</TableCell>
                          <TableCell><Badge className="bg-blue-100 text-blue-700">Significant</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 flex justify-between items-center bg-muted/30 p-4 rounded-lg border-2 border-dashed">
                     <p className="text-sm italic">Simulasi: Upload Trial Balance (Excel/CSV) untuk update otomatis.</p>
                     <Button variant="outline" size="sm">Upload TB</Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase text-primary">Cakupan Ruang Lingkup</CardTitle>
                    <CardDescription className="text-[10px]">SK-5 Bab III 1.3 (Syarat 2/3)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Total FSLI Covered</span>
                        <span className="font-bold">82%</span>
                      </div>
                      <Progress value={82} className="h-2" />
                    </div>
                    <div className="pt-2 border-t flex items-center gap-2">
                       <CheckCircle2 className="h-4 w-4 text-green-600" />
                       <span className="text-xs font-semibold text-green-700 italic">Memenuhi Syarat 2/3</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase">Proses Signifikan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-xs space-y-2">
                      <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" /> Order to Cash</li>
                      <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" /> Procure to Pay</li>
                      <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" /> Fixed Asset Management</li>
                      <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" /> Financial Closing & Reporting</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

// Helper component for icon
function Target({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}
