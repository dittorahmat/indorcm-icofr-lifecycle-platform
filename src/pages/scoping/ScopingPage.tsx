import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Wand2, Info, Plus } from 'lucide-react';
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
import { getGroupMultiplier, QualitativeScopingReason } from '@/lib/compliance-utils';
import type { Scoping, SignificantAccount } from '@shared/types';

interface HaircutWizardProps {
  onApply: (value: number) => void;
}

function HaircutWizard({ onApply }: HaircutWizardProps) {
  const [riskFactors, setRiskFactors] = React.useState({
    newImplementation: false,
    highTurnover: false,
    historyOfDeficiencies: false,
    complexChanges: false,
  });

  const calculateHaircut = () => {
    const activeFactors = Object.values(riskFactors).filter(Boolean).length;
    if (activeFactors === 0) return 25;
    if (activeFactors <= 2) return 50;
    return 75;
  };

  const currentHaircut = calculateHaircut();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-primary">
          <Wand2 className="h-3 w-3" /> Help me decide
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Haircut Risk Assessment</DialogTitle>
          <DialogDescription>
            Determine the Performance Materiality (PM) haircut based on the entity's control environment risk.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="newImpl" 
              checked={riskFactors.newImplementation} 
              onCheckedChange={(checked) => setRiskFactors(f => ({ ...f, newImplementation: !!checked }))}
            />
            <Label htmlFor="newImpl">First year of ICOFR implementation</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="turnover" 
              checked={riskFactors.highTurnover} 
              onCheckedChange={(checked) => setRiskFactors(f => ({ ...f, highTurnover: !!checked }))}
            />
            <Label htmlFor="turnover">High turnover in key accounting/IT staff</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="deficiencies" 
              checked={riskFactors.historyOfDeficiencies} 
              onCheckedChange={(checked) => setRiskFactors(f => ({ ...f, historyOfDeficiencies: !!checked }))}
            />
            <Label htmlFor="deficiencies">History of significant deficiencies or material weaknesses</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="changes" 
              checked={riskFactors.complexChanges} 
              onCheckedChange={(checked) => setRiskFactors(f => ({ ...f, complexChanges: !!checked }))}
            />
            <Label htmlFor="changes">Significant changes in business or accounting processes</Label>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold">Recommended Haircut:</span>
              <Badge variant={currentHaircut === 25 ? "secondary" : currentHaircut === 50 ? "default" : "destructive"}>
                {currentHaircut}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground italic">
              Resulting PM will be {(100 - currentHaircut)}% of Overall Materiality.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onApply(currentHaircut)}>Apply Recommended Haircut</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface QualitativeScopingWizardProps {
  onAdd: (account: SignificantAccount) => void;
}

function QualitativeScopingWizard({ onAdd }: QualitativeScopingWizardProps) {
  const [name, setName] = React.useState("");
  const [balance, setBalance] = React.useState(0);
  const [reasons, setReasons] = React.useState<QualitativeScopingReason[]>([]);

  const allReasons: QualitativeScopingReason[] = [
    "Besarnya eksposur risiko kecurangan",
    "Volume transaksi, kompleksitas, dan homogenitas",
    "Adanya perubahan signifikan dalam karakteristik akun",
    "Akun yang memerlukan judgement tinggi",
    "Akun yang dipengaruhi oleh estimasi",
    "Kepatuhan terhadap loan covenant",
    "Aset yang dikelola oleh pihak ketiga",
    "Lainnya"
  ];

  const toggleReason = (reason: QualitativeScopingReason) => {
    setReasons(prev => prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Add Qualitative Account (Table 5)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <DialogHeader>
            <DialogTitle>Qualitative Scoping Entry</DialogTitle>
            <DialogDescription>
              Menambahkan akun signifikan berdasarkan faktor kualitatif meskipun di bawah ambang batas PM.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase">Account Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Construction in Progress" className="h-9" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="balance" className="text-xs font-bold uppercase">Balance (IDR)</Label>
              <Input id="balance" type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} className="h-9" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase">Qualitative Reasons (Refer to Table 5)</Label>
              <div className="space-y-2 border rounded-md p-3 max-h-[200px] overflow-y-auto bg-muted/10">
                {allReasons.map(r => (
                  <div key={r} className="flex items-center space-x-2">
                    <Checkbox id={r} checked={reasons.includes(r)} onCheckedChange={() => toggleReason(r)} />
                    <Label htmlFor={r} className="text-[11px] font-normal leading-tight cursor-pointer">{r}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              onAdd({ name, balance, isQuantitative: false, qualitativeReasons: reasons });
              setName(""); setBalance(0); setReasons([]);
            }} disabled={!name || reasons.length === 0} className="w-full">Add to Scope</Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

interface GroupAllocationProps {
  baseOM: number;
  totalEntities: number;
  multiplier: number;
}

function GroupAllocation({ baseOM, totalEntities, multiplier }: GroupAllocationProps) {
  const maxGroupOM = baseOM * multiplier;
  
  // Mock child entities for simulation
  const [entities, setEntities] = React.useState([
    { id: '1', name: 'Subsidiary A (Energy)', assets: 5000000000 },
    { id: '2', name: 'Subsidiary B (Logistics)', assets: 3000000000 },
    { id: '3', name: 'Subsidiary C (Finance)', assets: 2000000000 },
  ]);

  const totalAssets = entities.reduce((sum, e) => sum + e.assets, 0);

  return (
    <Card className="mt-6 border-blue-200 bg-blue-50/30">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Network className="h-5 w-5" /> Group Materiality Allocation (FAQ No. 4)
            </CardTitle>
            <CardDescription className="text-blue-600/80 italic">Proporsional alokasi berdasarkan total aset masing-masing entitas anak.</CardDescription>
          </div>
          <Badge className="bg-blue-600">Max Group OM: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(maxGroupOM)}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-blue-200">
              <TableHead className="text-blue-800">Entity Name</TableHead>
              <TableHead className="text-blue-800 text-right">Total Assets</TableHead>
              <TableHead className="text-blue-800 text-right">Prop. Share (%)</TableHead>
              <TableHead className="text-blue-800 text-right">Allocated OM</TableHead>
              <TableHead className="text-blue-800">Compliance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entities.map(e => {
              const share = (e.assets / totalAssets);
              const allocated = maxGroupOM * share;
              const isOverLimit = allocated > baseOM; // Limit: Individual OM cannot exceed Group base OM

              return (
                <TableRow key={e.id} className="border-blue-100">
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{new Intl.NumberFormat('id-ID').format(e.assets)}</TableCell>
                  <TableCell className="text-right">{(share * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-right font-bold text-blue-700">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(allocated)}
                  </TableCell>
                  <TableCell>
                    {isOverLimit ? (
                      <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Capped at Base OM</Badge>
                    ) : (
                      <Badge className="bg-green-600 gap-1"><CheckCircle2 className="h-3 w-3" /> Within Limit</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="mt-4 p-3 bg-blue-100/50 rounded text-[10px] text-blue-800 leading-relaxed">
          <strong>Regulasi Rule:</strong> Nilai alokasi materialitas dari masing-masing Lokasi/Perusahaan tidak boleh melebihi nilai OM Grup (Base OM). Total alokasi atas seluruh Lokasi tidak boleh melebihi nilai maksimal materialitas dari Grup OM (Multiplier x Base OM).
        </div>
      </CardContent>
    </Card>
  );
}

export function ScopingPage() {
  const { data: materialityData, isLoading: matLoading } = useQuery({
    queryKey: ['materiality'],
    queryFn: () => api<{ items: Materiality[] }>('/api/materiality'),
  });

  const { data: scopingData, isLoading: scopeLoading } = useQuery({
    queryKey: ['scoping'],
    queryFn: () => api<{ items: Scoping[] }>('/api/scoping'),
  });

  const currentScope = scopingData?.items?.[0];
  const [localAccounts, setLocalAccounts] = React.useState<SignificantAccount[]>([]);

  React.useEffect(() => {
    if (currentScope?.significantAccounts) {
      setLocalAccounts(currentScope.significantAccounts);
    }
  }, [currentScope]);

  const isLoading = matLoading || scopeLoading;


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

                  {formValues.locationCount > 1 && (
                    <GroupAllocation 
                      baseOM={baseOM} 
                      totalEntities={formValues.locationCount} 
                      multiplier={multiplier} 
                    />
                  )}

                  <div className="flex justify-end mt-6">
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
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Significant Accounts Matrix</CardTitle>
                      <CardDescription>Accounts flagged based on PM threshold: {formatCurrency(performanceMateriality)}</CardDescription>
                    </div>
                    <QualitativeScopingWizard onAdd={(acc) => setLocalAccounts(prev => [...prev, acc])} />
                  </div>
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
                      {localAccounts.map((acc, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{acc.name}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{formatCurrency(acc.balance)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {acc.isQuantitative ? "> PM (Quantitative)" : (
                              <div className="flex flex-col gap-1">
                                <span className="font-bold text-amber-700">Qualitative (Table 5):</span>
                                <ul className="list-disc pl-4 space-y-0.5">
                                  {acc.qualitativeReasons?.map(r => <li key={r}>{r}</li>)}
                                </ul>
                              </div>
                            )}
                          </TableCell>
                          <TableCell><Badge className={acc.isQuantitative ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}>Significant</Badge></TableCell>
                        </TableRow>
                      ))}
                      {localAccounts.length === 0 && !isLoading && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">No accounts in scope. Upload TB or add qualitative entries.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <div className="mt-4 flex justify-between items-center bg-muted/30 p-4 rounded-lg border-2 border-dashed">
                     <p className="text-sm italic text-muted-foreground">Simulasi: Upload Trial Balance (Excel/CSV) untuk identifikasi kuantitatif otomatis.</p>
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
                    {/* Simplified calculation for demo: sum of account balances vs benchmark value */}
                    {(() => {
                      const totalInScope = localAccounts.reduce((sum, a) => sum + a.balance, 0);
                      const coverage = formValues.benchmarkValue > 0 ? (totalInScope / formValues.benchmarkValue) * 100 : 0;
                      const isPassing = coverage >= 66.6;

                      return (
                        <>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>Account Balance Coverage</span>
                              <span className="font-bold">{coverage.toFixed(1)}%</span>
                            </div>
                            <Progress value={coverage} className="h-2" />
                          </div>
                          <div className="pt-2 border-t flex items-center gap-2">
                             <CheckCircle2 className={cn("h-4 w-4", isPassing ? "text-green-600" : "text-muted-foreground")} />
                             <span className={cn("text-xs font-semibold italic", isPassing ? "text-green-700" : "text-muted-foreground")}>
                               {isPassing ? "Memenuhi Syarat 2/3 (Precision)" : "Belum Memenuhi Syarat 2/3"}
                             </span>
                          </div>
                        </>
                      );
                    })()}
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
