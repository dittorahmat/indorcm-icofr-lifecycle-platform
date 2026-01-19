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
import { CheckCircle2, Wand2, Info, Plus, Network, AlertTriangle } from 'lucide-react';
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
  const [entities] = React.useState([
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
              const isOverLimit = allocated > baseOM; 

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

  const { register, control, watch, setValue } = useForm<MaterialityForm>({
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
            <TabsTrigger value="investee">Investee Monitoring (FAQ 5)</TabsTrigger>
          </TabsList>

          <TabsContent value="materiality" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Materiality Calculation</CardTitle>
                <CardDescription>Determine Overall Materiality (OM) and Performance Materiality (PM).</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Benchmark Basis</Label>
                      <Controller control={control} name="benchmark" render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select benchmark" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pre-Tax Income">Pre-Tax Income</SelectItem>
                            <SelectItem value="Revenue">Revenue</SelectItem>
                            <SelectItem value="Assets">Total Assets</SelectItem>
                            <SelectItem value="Equity">Total Equity</SelectItem>
                          </SelectContent>
                        </Select>
                      )} />
                    </div>
                    <div className="space-y-2">
                      <Label>Benchmark Value (IDR)</Label>
                      <Input type="number" {...register("benchmarkValue", { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Significant Locations (Multiplier: {multiplier}x)</Label>
                      <Input type="number" {...register("locationCount", { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Haircut for PM (%)</Label>
                        <HaircutWizard onApply={(val) => setValue("haircut", val)} />
                      </div>
                      <Input type="number" {...register("haircut", { valueAsNumber: true })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-6 rounded-lg border-2 border-primary/10">
                    <div>
                      <h3 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">Overall Materiality (OM)</h3>
                      <p className="text-3xl font-bold text-primary">{formatCurrency(overallMateriality)}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-muted-foreground">Performance Materiality (PM)</h3>
                      <p className="text-3xl font-bold text-primary">{formatCurrency(performanceMateriality)}</p>
                    </div>
                  </div>

                  {formValues.locationCount > 1 && (
                    <GroupAllocation baseOM={baseOM} totalEntities={formValues.locationCount} multiplier={multiplier} />
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scoping" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>Significant Accounts Matrix</CardTitle>
                    <QualitativeScopingWizard onAdd={(acc) => setLocalAccounts(prev => [...prev, acc])} />
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Account Name</TableHead><TableHead className="text-right">Balance</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {localAccounts.map((acc, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{acc.name}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{formatCurrency(acc.balance)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{acc.isQuantitative ? "> PM" : "Qualitative"}</TableCell>
                          <TableCell><Badge>Significant</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card className="bg-primary/5 border-primary/20 h-fit">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-bold uppercase">Cakupan Ruang Lingkup</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex justify-between text-xs mb-1"><span>Account Coverage</span><span className="font-bold">82.1%</span></div>
                  <Progress value={82.1} className="h-2" />
                  <div className="pt-4 flex items-center gap-2 text-green-700 text-xs font-semibold"><CheckCircle2 className="h-4 w-4" /> Memenuhi Syarat 2/3 (Bab III 1.3)</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="investee" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800"><Target className="h-5 w-5" /> Equity Method Investee Monitoring</CardTitle>
                <CardDescription>Sesuai FAQ No. 5 (Hal 105), pemantauan atas investee non-konsolidasi.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Investee Name</TableHead><TableHead>Ownership %</TableHead><TableHead>Audit Status</TableHead><TableHead>Controls</TableHead><TableHead>Action</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-semibold">PT Energy Associate (JV)</TableCell>
                      <TableCell>35.0%</TableCell>
                      <TableCell><Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Audit Report Received</Badge></TableCell>
                      <TableCell className="text-[10px]">Equity Adjustment Review</TableCell>
                      <TableCell><Button variant="ghost" size="sm">Review</Button></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function Target({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
  )
}