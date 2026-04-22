import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { RiskLibrary, BUMNCluster, ControlAssertion, UserRole } from '@shared/types';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Edit, Trash2, Search, BookOpen, Filter, Loader2, AlertTriangle,
  X, Check, ShieldCheck
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Sheet, SheetContent, SheetDescription, SheetHeader, 
  SheetTitle, SheetFooter 
} from '@/components/ui/sheet';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage 
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const BUMN_CLUSTERS: BUMNCluster[] = [
  "Umum", "Industri Energi", "Industri Pangan dan Pupuk", "Jasa Keuangan",
  "Industri Mineral dan Batubara", "Jasa Telekomunikasi dan Media",
  "Jasa Infrastruktur", "Jasa Asuransi dan Dana Pensiun",
  "Jasa Pariwisata dan Pendukung", "Industri Perkebunan dan Kehutanan",
  "Jasa Logistik"
];

const ASSERTIONS: ControlAssertion[] = [
  "Completeness", "Accuracy", "Validity", "Cut-off", 
  "Presentation", "Existence", "Valuation", "Occurrence", "Classification"
];

const riskSchema = z.object({
  cluster: z.string().min(1, "Cluster is required"),
  riskDescription: z.string().min(1, "Risk description is required"),
  suggestedAssertions: z.array(z.string()).default([]),
});

type RiskFormValues = z.infer<typeof riskSchema>;

export function RiskLibraryPage() {
  const { t } = useTranslation(['risklibrary', 'common']);
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCluster, setSelectedCluster] = React.useState<string>('All');
  const [editingRisk, setEditingRisk] = React.useState<RiskLibrary | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const { data: risksData, isLoading } = useQuery({
    queryKey: ['risklibrary', selectedCluster],
    queryFn: () => api<{ items: RiskLibrary[] }>(`/api/risklibrary${selectedCluster !== 'All' ? `?cluster=${selectedCluster}` : ''}`),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api<{ role: UserRole }>('/api/user/me'),
  });

  const isAdminOrLine2 = currentUser?.role === 'Admin' || currentUser?.role === 'Line 2';

  const form = useForm<RiskFormValues>({
    resolver: zodResolver(riskSchema),
    defaultValues: {
      cluster: '',
      riskDescription: '',
      suggestedAssertions: [],
    }
  });

  React.useEffect(() => {
    if (editingRisk) {
      form.reset({
        cluster: editingRisk.cluster,
        riskDescription: editingRisk.riskDescription,
        suggestedAssertions: editingRisk.suggestedAssertions || [],
      });
    } else {
      form.reset({
        cluster: selectedCluster !== 'All' ? selectedCluster : '',
        riskDescription: '',
        suggestedAssertions: [],
      });
    }
  }, [editingRisk, form, selectedCluster]);

  const mutation = useMutation({
    mutationFn: (values: RiskFormValues) => {
      const method = editingRisk ? 'PUT' : 'POST';
      const url = editingRisk ? `/api/risklibrary/${editingRisk.id}` : '/api/risklibrary';
      return api(url, { method, body: JSON.stringify(values) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risklibrary'] });
      setIsSheetOpen(false);
      setEditingRisk(null);
      toast.success(editingRisk ? t('messages.success_update') : t('messages.success_add'));
    },
    onError: (err: any) => {
      toast.error(err.message || t('messages.error_save'));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/risklibrary/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risklibrary'] });
      toast.success(t('messages.success_delete'));
    },
  });

  const filteredRisks = (risksData?.items || []).filter(r => 
    r.riskDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout container>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground italic text-sm">{t('description')}</p>
          </div>
          {isAdminOrLine2 && (
            <Button onClick={() => { setEditingRisk(null); setIsSheetOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" /> {t('add_button')}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-100/50 p-4 rounded-lg border border-slate-200">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t('search_placeholder')}
              className="pl-9 bg-white" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div>
            <Select value={selectedCluster} onValueChange={setSelectedCluster}>
              <SelectTrigger className="bg-white">
                <Filter className="h-3.5 w-3.5 mr-2 text-slate-400" />
                <SelectValue placeholder={t('filter_all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">{t('filter_all')}</SelectItem>
                {BUMN_CLUSTERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-end px-2">
            <Badge variant="outline" className="bg-white font-mono text-[10px]">
              {filteredRisks.length} {t('entries_count')}
            </Badge>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-[200px] font-bold">{t('table.cluster')}</TableHead>
                  <TableHead className="font-bold">{t('table.description')}</TableHead>
                  <TableHead className="w-[250px] font-bold">{t('table.assertions')}</TableHead>
                  <TableHead className="w-[100px] text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="h-32 text-center text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> {t('messages.loading')}</TableCell></TableRow>
                ) : filteredRisks.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-32 text-center text-slate-400 italic">{t('messages.empty')}</TableCell></TableRow>
                ) : filteredRisks.map((risk) => (
                  <TableRow key={risk.id} className="group hover:bg-slate-50/50 transition-colors">
                    <TableCell className="align-top py-4">
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border-slate-200">
                        {risk.cluster}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <p className="text-sm font-medium text-slate-800 leading-relaxed">{risk.riskDescription}</p>
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <div className="flex flex-wrap gap-1">
                        {risk.suggestedAssertions?.map(a => (
                          <Badge key={a} variant="outline" className="text-[9px] font-bold border-indigo-100 text-indigo-600 bg-indigo-50/30">
                            {a}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      {isAdminOrLine2 && (
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => { setEditingRisk(risk); setIsSheetOpen(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => { if(confirm(t('messages.confirm_delete'))) deleteMutation.mutate(risk.id); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>{editingRisk ? t('edit_button') : t('add_button')}</SheetTitle>
            <SheetDescription>
              {t('description')}
            </SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(v => mutation.mutate(v))} className="space-y-6 py-6">
              <FormField
                control={form.control}
                name="cluster"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.cluster_label')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('form.cluster_placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BUMN_CLUSTERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="riskDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.description_label')}</FormLabel>
                    <FormControl>
                      <textarea 
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="suggestedAssertions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.assertions_label')}</FormLabel>
                    <div className="grid grid-cols-2 gap-2 p-3 border rounded-md bg-slate-50">
                      {ASSERTIONS.map((a) => (
                        <div key={a} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`a-${a}`}
                            checked={field.value?.includes(a)}
                            onCheckedChange={(checked) => {
                              const next = checked 
                                ? [...(field.value || []), a]
                                : (field.value || []).filter(v => v !== a);
                              field.onChange(next);
                            }}
                          />
                          <label htmlFor={`a-${a}`} className="text-xs font-medium leading-none cursor-pointer">{a}</label>
                        </div>
                      ))}
                    </div>
                    <FormDescription className="text-[10px]">{t('form.assertions_desc')}</FormDescription>
                  </FormItem>
                )}
              />

              <SheetFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)}>{t('common:actions.cancel')}</Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingRisk ? t('form.update_button') : t('form.save_button')}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
