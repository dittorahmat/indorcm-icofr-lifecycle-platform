import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { RCM, Control, UserRole, WBSReport, User } from '@shared/types';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Edit, Trash2, Search, FileDown, CheckCircle2, AlertTriangle, 
  History, Eye, Network, BellRing, Cloud, ShieldAlert, Zap,
  Loader2, Info, ChevronRight, LayoutDashboard, Database, PlusCircle, Edit2,
  ShieldCheck
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogFooter, DialogTrigger 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ControlEditor } from '@/components/rcm/ControlEditor';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { BPMEditor } from '@/components/rcm/BPMEditor';

export function RCMList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const editingControlId = searchParams.get('controlId');
  const isEditorOpen = !!editingControlId || searchParams.get('new') === 'true';
  const [selectedControl, setSelectedControl] = React.useState<Partial<Control> | null>(null);

  const handleEditControl = (control: Control) => {
    setSelectedControl(control);
    setSearchParams({ controlId: control.id });
  };

  const handleCreateControl = (initialData: Partial<Control>) => {
    setSelectedControl(initialData);
    setSearchParams({ new: 'true' });
  };

  const handleCloseEditor = () => {
    setSearchParams({});
    setSelectedControl(null);
  };

  // 1. Fetch Controls
  const { data: controlsData, isLoading: controlsLoading } = useQuery({
    queryKey: ['controls'],
    queryFn: () => api<{ items: Control[] }>('/api/controls'),
  });

  // 2. Fetch WBS Reports
  const { data: wbsData } = useQuery({
    queryKey: ['wbs-reports'],
    queryFn: () => api<{ items: WBSReport[] }>('/api/wbsreports'),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api<User>('/api/user/me'),
  });

  const isAdminOrLine2 = currentUser?.role === 'Admin' || currentUser?.role === 'Line 2';

  const COSO_PRINCIPLES = [
    { id: 1, name: "Integritas dan Nilai Etika", component: "Lingkungan Pengendalian" },
    { id: 2, name: "Pengawasan Dewan Komisaris", component: "Lingkungan Pengendalian" },
    { id: 3, name: "Struktur, Wewenang & Tanggung Jawab", component: "Lingkungan Pengendalian" },
    { id: 4, name: "Komitmen terhadap Kompetensi", component: "Lingkungan Pengendalian" },
    { id: 5, name: "Akuntabilitas Personel", component: "Lingkungan Pengendalian" },
    { id: 6, name: "Tujuan Pengendalian Intern", component: "Penilaian Risiko" },
    { id: 7, name: "Identifikasi & Analisis Risiko", component: "Penilaian Risiko" },
    { id: 8, name: "Risiko Kecurangan (Fraud)", component: "Penilaian Risiko" },
    { id: 9, name: "Analisis Perubahan Signifikan", component: "Penilaian Risiko" },
    { id: 10, name: "Menentukan Aktivitas Pengendalian", component: "Aktivitas Pengendalian" },
    { id: 11, name: "Pengendalian Umum TI (ITGC)", component: "Aktivitas Pengendalian" },
    { id: 12, name: "Kebijakan dan Prosedur", component: "Aktivitas Pengendalian" },
    { id: 13, name: "Informasi Relevan & Berkualitas", component: "Informasi dan Komunikasi" },
    { id: 14, name: "Komunikasi Internal Efektif", component: "Informasi dan Komunikasi" },
    { id: 15, name: "Komunikasi Eksternal Efektif", component: "Informasi dan Komunikasi" },
    { id: 16, name: "Evaluasi Berkelanjutan & Terpisah", component: "Pemantauan" },
    { id: 17, name: "Evaluasi & Komunikasi Defisiensi", component: "Pemantauan" },
  ];

  const filteredControls = (controlsData?.items || []).filter(c => 
    c.level === 'TLC' && 
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.code?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AppLayout container>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">RCM Manager</h1>
            <p className="text-muted-foreground italic text-sm">Regulatory Compliance Management according to SK-5/DKU.MBU/11/2024.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline"><FileDown className="h-4 w-4 mr-2" /> Export RCM</Button>
          </div>
        </div>

        <Tabs defaultValue="tlc" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-8 mb-4">
            <TabsTrigger value="tlc" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent px-2 py-3 font-bold text-slate-500 data-[state=active]:text-indigo-600">
              RCM TLC (Operasional)
            </TabsTrigger>
            {isAdminOrLine2 && (
              <TabsTrigger value="elc" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent px-2 py-3 font-bold text-slate-500 data-[state=active]:text-indigo-600">
                RCM ELC (Entity Level)
              </TabsTrigger>
            )}
            <TabsTrigger value="itgc" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent px-2 py-3 font-bold text-slate-500 data-[state=active]:text-indigo-600">
              RCM ITGC (General TI)
            </TabsTrigger>
            <TabsTrigger value="wbs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent px-2 py-3 font-bold text-slate-500 data-[state=active]:text-indigo-600">
              Whistleblowing Integration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tlc" className="space-y-6">
            <div className="flex items-center justify-between gap-4 bg-slate-100/50 p-4 rounded-lg border border-slate-200">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari kontrol teknis..." className="pl-9 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Button size="sm" onClick={() => navigate('/rcm/tlc')} className="bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                 <LayoutDashboard className="h-4 w-4 mr-2" /> Buka Matriks Horizontal
              </Button>
            </div>

            <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-[100px] font-bold">Code</TableHead>
                    <TableHead className="font-bold">Aktivitas Pengendalian</TableHead>
                    <TableHead className="font-bold">Nature</TableHead>
                    <TableHead className="font-bold text-center">Risk</TableHead>
                    <TableHead className="text-center font-bold">Linked ELC</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {controlsLoading ? (
                    <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-400">Loading controls...</TableCell></TableRow>
                  ) : filteredControls.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-400 italic">No TLC records found.</TableCell></TableRow>
                  ) : filteredControls.map((ctrl) => (
                    <TableRow key={ctrl.id} className="group hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-slate-500">{ctrl.code}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">{ctrl.name}</span>
                          <span className="text-xs text-slate-500 line-clamp-1">{ctrl.description}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px] font-bold uppercase">{ctrl.nature}</Badge></TableCell>
                      <TableCell className="text-center"><Badge className={cn("text-[10px] font-bold", ctrl.riskRating === 'High' ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>{ctrl.riskRating}</Badge></TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {ctrl.relatedControlIds && ctrl.relatedControlIds.length > 0 ? (
                            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 font-bold gap-1.5 py-1">
                              <ShieldCheck className="h-3 w-3" /> {ctrl.relatedControlIds.length} Linked
                            </Badge>
                          ) : <span className="text-[10px] text-slate-300 italic">No Link</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100" onClick={() => handleEditControl(ctrl)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="itgc" className="space-y-6">
            <div className="flex items-center justify-between gap-4 bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari kontrol TI..." className="pl-9 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Button size="sm" onClick={() => navigate('/rcm/itgc')} className="bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 shadow-sm font-bold">
                 <LayoutDashboard className="h-4 w-4 mr-2" /> Buka Matriks ITGC (Lampiran 5.c)
              </Button>
            </div>

            <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-[120px] font-bold">Domain</TableHead>
                    <TableHead className="w-[100px] font-bold">Code</TableHead>
                    <TableHead className="font-bold">Aktivitas Pengendalian TI</TableHead>
                    <TableHead className="w-[150px] font-bold text-center">Tipe Otomatis</TableHead>
                    <TableHead className="w-[150px] font-bold">Aplikasi</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {controlsLoading ? (
                    <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-400">Loading controls...</TableCell></TableRow>
                  ) : (controlsData?.items || []).filter(c => c.level === 'ITGC' && (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.code?.toLowerCase().includes(searchTerm.toLowerCase()))).length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-400 italic">No ITGC records found.</TableCell></TableRow>
                  ) : (controlsData?.items || []).filter(c => c.level === 'ITGC' && (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.code?.toLowerCase().includes(searchTerm.toLowerCase()))).map((ctrl) => (
                    <TableRow key={ctrl.id} className="group hover:bg-indigo-50/10 transition-colors">
                      <TableCell><Badge variant="outline" className="text-[10px] font-bold text-indigo-600 border-indigo-200 bg-indigo-50">{ctrl.itgcDomain || 'Unassigned'}</Badge></TableCell>
                      <TableCell className="font-mono text-xs font-bold text-slate-500">{ctrl.code}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">{ctrl.name}</span>
                          <span className="text-xs text-slate-500 line-clamp-1">{ctrl.description}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-slate-100 text-slate-600 border-none text-[9px] font-bold uppercase">{ctrl.automatedControlType || '-'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-600">{ctrl.supportingApp || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100" onClick={() => handleEditControl(ctrl)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {isAdminOrLine2 && (
            <TabsContent value="elc" className="pt-2 space-y-6">
               <div className="flex items-center justify-between gap-4 bg-indigo-50/50 p-6 rounded-xl border border-indigo-100">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-indigo-900">RCM Entity Level (ELC)</h3>
                  <p className="text-sm text-indigo-700/70 leading-relaxed">Evaluasi 17 Prinsip COSO sebagai fondasi pengendalian internal perusahaan.</p>
                </div>
                <Button onClick={() => handleCreateControl({ level: 'ELC' })} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg">
                   <PlusCircle className="h-4 w-4 mr-2" /> Add Entity Control
                </Button>
              </div>

              <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-[300px] font-bold">Prinsip COSO</TableHead>
                      <TableHead className="font-bold text-indigo-900">Aktivitas Pengendalian (Kebijakan Perusahaan)</TableHead>
                      <TableHead className="w-[150px] text-center font-bold">Status Pemetaan</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {COSO_PRINCIPLES.map((principle) => {
                      const relatedControls = (controlsData?.items || []).filter(c => c.level === 'ELC' && c.cosoPrinciples?.includes(principle.id as any));
                      return (
                        <React.Fragment key={principle.id}>
                          {(principle.id === 1 || principle.id === 6 || principle.id === 10 || principle.id === 13 || principle.id === 16) && (
                            <TableRow className="bg-slate-100/50 hover:bg-slate-100/50 border-y-2 border-slate-200">
                              <TableCell colSpan={4} className="py-2 px-4"><span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">{principle.component}</span></TableCell>
                            </TableRow>
                          )}
                          <TableRow className="group hover:bg-indigo-50/20 transition-colors">
                            <TableCell className="align-top py-6">
                              <div className="flex gap-4">
                                <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-black shrink-0 border border-indigo-200">{principle.id}</div>
                                <div className="space-y-0.5">
                                   <span className="text-[13px] font-bold text-slate-800 leading-tight block">{principle.name}</span>
                                   <span className="text-[10px] text-slate-400 font-medium">COSO Principle {principle.id}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="space-y-2.5">
                                {relatedControls.length > 0 ? relatedControls.map(ctrl => (
                                  <div key={ctrl.id} className="flex flex-col p-3 border rounded-lg bg-white shadow-sm group/item hover:border-indigo-300 transition-colors">
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-center gap-2">
                                         <Badge variant="outline" className="text-[9px] font-mono h-4">{ctrl.code || 'N/A'}</Badge>
                                         <span className="text-xs font-bold text-slate-800">{ctrl.name}</span>
                                      </div>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/item:opacity-100" onClick={() => handleEditControl(ctrl)}>
                                        <Edit2 className="h-3 w-3 text-indigo-600" />
                                      </Button>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed italic">"{ctrl.description}"</p>
                                    <div className="flex items-center gap-3 mt-3">
                                       <Badge className="bg-slate-100 text-slate-600 border-none text-[9px] font-bold uppercase">{ctrl.frequency}</Badge>
                                       {ctrl.attachmentUrl && <div className="flex items-center gap-1.5 text-indigo-600 text-[10px] font-black"><FileDown className="h-3.5 w-3.5" /> DOKUMEN KEBIJAKAN</div>}
                                    </div>
                                  </div>
                                )) : (
                                  <div className="flex items-center gap-2 py-4 text-slate-300">
                                     <ShieldAlert className="h-4 w-4" />
                                     <span className="text-xs italic font-medium tracking-tight">Belum ada kebijakan yang dipetakan.</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-4">
                               {relatedControls.length > 0 ? <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] shadow-sm">TERPETAKAN</Badge> : <Badge variant="outline" className="text-rose-400 border-rose-200 bg-rose-50 text-[9px] font-black animate-pulse">GAP (RISIKO)</Badge>}
                            </TableCell>
                            <TableCell className="text-right py-4 pr-6">
                               <Button variant="ghost" size="icon" className="h-9 w-9 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 rounded-full" onClick={() => handleCreateControl({ level: 'ELC', cosoPrinciples: [principle.id as any], name: `Kontrol Prinsip ${principle.id}` })}>
                                  <Plus className="h-4 w-4" />
                               </Button>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          <TabsContent value="wbs" className="pt-2">
            {/* WBS UI Placeholder */}
          </TabsContent>
        </Tabs>
      </div>

      <ControlEditor isOpen={isEditorOpen} setIsOpen={handleCloseEditor} control={selectedControl} />
    </AppLayout>
  );
}
