import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { Control, WBSReport, User } from '@shared/types';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, FileDown, ShieldCheck, 
  LayoutDashboard, PlusCircle, Edit2,
  ShieldAlert, Fingerprint, Lock, Zap, Target
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ControlEditor } from '@/components/rcm/ControlEditor';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 15, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
};

export function RCMList() {
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

  const tlcControls = (controlsData?.items || []).filter(c => c.level === 'TLC');
  const filteredTlc = tlcControls.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const itgcControls = (controlsData?.items || []).filter(c => c.level === 'ITGC');
  const filteredItgc = itgcControls.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const elcControls = (controlsData?.items || []).filter(c => c.level === 'ELC');

  return (
    <AppLayout container>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex flex-col space-y-8 pb-10"
      >
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-display font-bold tracking-tight text-slate-900 leading-none">Risk Control Matrix</h1>
            <p className="text-slate-500 text-sm font-medium max-w-2xl leading-relaxed">
              Manajemen Kepatuhan Regulasi sesuai <span className="text-indigo-600 font-bold italic">SK-5/DKU.MBU/11/2024</span>. 
              Dokumentasi aktivitas pengendalian internal untuk integritas laporan keuangan.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-11 gap-2 border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all font-bold text-xs uppercase tracking-widest px-5">
              <FileDown className="h-4 w-4 text-indigo-500" /> Ekspor RCM
            </Button>
          </div>
        </motion.div>

        <Tabs defaultValue="tlc" className="w-full">
          <motion.div variants={itemVariants} className="bg-slate-100/50 p-1 border border-slate-200 rounded-2xl w-fit mb-8">
            <TabsList className="bg-transparent h-auto p-0 flex gap-1">
              {[
                { value: 'tlc', label: 'TLC (Operasional)', count: tlcControls.length },
                { value: 'elc', label: 'ELC (Entity Level)', count: elcControls.length, hidden: !isAdminOrLine2 },
                { value: 'itgc', label: 'ITGC (IT General)', count: itgcControls.length },
                { value: 'wbs', label: 'WBS Integration', count: 0 },
              ].filter(t => !t.hidden).map((tab) => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value} 
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-indigo-600 transition-all font-bold text-xs uppercase tracking-widest py-3 px-6 text-slate-500 flex items-center gap-2.5"
                >
                  {tab.label}
                  <Badge className="bg-slate-200/50 text-slate-500 group-data-[state=active]:bg-indigo-50 group-data-[state=active]:text-indigo-600 border-none px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center font-mono">
                    {tab.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </motion.div>

          <AnimatePresence mode="wait">
            <TabsContent value="tlc" className="space-y-6 m-0 outline-none">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="relative max-w-md w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input 
                      placeholder="Cari aktivitas pengendalian operasional..." 
                      className="pl-11 h-11 bg-slate-50 border-slate-200 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all rounded-xl" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                  </div>
                  <Button onClick={() => navigate('/rcm/tlc')} className="h-11 gap-3 bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all font-bold text-xs uppercase tracking-widest px-6 rounded-xl">
                    <LayoutDashboard className="h-4 w-4" /> Buka Matriks Horizontal
                  </Button>
                </div>

                <div className="border border-slate-200 rounded-3xl bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                      <TableRow>
                        <TableHead className="w-[120px] font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 px-6 py-5">Kode</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 py-5">Aktivitas Pengendalian</TableHead>
                        <TableHead className="w-[120px] font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 py-5">Sifat</TableHead>
                        <TableHead className="w-[120px] font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 text-center py-5">Risiko</TableHead>
                        <TableHead className="w-[150px] text-center font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 py-5">Tautan ELC</TableHead>
                        <TableHead className="w-[100px] py-5 px-6"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {controlsLoading ? (
                        <TableRow><TableCell colSpan={6} className="h-40 text-center text-slate-400 font-medium italic">Memuat basis data kontrol...</TableCell></TableRow>
                      ) : filteredTlc.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="h-40 text-center text-slate-400 italic">Tidak ada rekaman TLC ditemukan.</TableCell></TableRow>
                      ) : filteredTlc.map((ctrl, i) => (
                        <TableRow key={ctrl.id} className={cn("group hover:bg-slate-50 transition-colors", i % 2 === 1 && "bg-slate-50/30")}>
                          <TableCell className="font-mono text-[11px] font-bold text-slate-500 px-6 py-4">{ctrl.code}</TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col space-y-1">
                              <span className="text-sm font-display font-bold text-slate-900 leading-tight">{ctrl.name}</span>
                              <span className="text-[11px] text-slate-500 line-clamp-1 italic">"{ctrl.description}"</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest h-6 px-2.5 bg-slate-50 border-slate-200 text-slate-600">
                              {ctrl.nature}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center py-4">
                            <Badge className={cn(
                              "text-[9px] font-bold h-6 px-2.5 border-none shadow-sm uppercase tracking-wider", 
                              ctrl.riskRating === 'High' ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
                            )}>
                              {ctrl.riskRating}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center py-4">
                            <div className="flex justify-center">
                              {ctrl.relatedControlIds && ctrl.relatedControlIds.length > 0 ? (
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold gap-2 py-1 px-3 text-[10px] uppercase tracking-tighter">
                                  <ShieldCheck className="h-3 w-3" /> {ctrl.relatedControlIds.length} Linked
                                </Badge>
                              ) : <span className="text-[10px] text-slate-300 italic font-medium">No Link</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-4 px-6">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all rounded-xl" 
                              onClick={() => handleEditControl(ctrl)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="itgc" className="space-y-6 m-0 outline-none">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="relative max-w-md w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input 
                      placeholder="Cari kontrol tata kelola TI..." 
                      className="pl-11 h-11 bg-slate-50 border-slate-200 text-sm font-medium focus:bg-white rounded-xl transition-all" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                  </div>
                  <Button onClick={() => navigate('/rcm/itgc')} variant="outline" className="h-11 gap-3 border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-all font-bold text-xs uppercase tracking-widest px-6 rounded-xl">
                    <Fingerprint className="h-4 w-4" /> Buka Matriks ITGC
                  </Button>
                </div>

                <div className="border border-slate-200 rounded-3xl bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                      <TableRow>
                        <TableHead className="w-[140px] font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 px-6 py-5">Domain</TableHead>
                        <TableHead className="w-[120px] font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 py-5">Kode</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 py-5">Aktivitas Pengendalian TI</TableHead>
                        <TableHead className="w-[150px] font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 text-center py-5">Otomasi</TableHead>
                        <TableHead className="w-[150px] font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 py-5">Aplikasi</TableHead>
                        <TableHead className="w-[100px] px-6 py-5"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {controlsLoading ? (
                        <TableRow><TableCell colSpan={6} className="h-40 text-center text-slate-400">Memuat basis data kontrol TI...</TableCell></TableRow>
                      ) : filteredItgc.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="h-40 text-center text-slate-400 italic">Tidak ada rekaman ITGC ditemukan.</TableCell></TableRow>
                      ) : filteredItgc.map((ctrl, i) => (
                        <TableRow key={ctrl.id} className={cn("group hover:bg-slate-50 transition-colors", i % 2 === 1 && "bg-slate-50/30")}>
                          <TableCell className="px-6 py-4">
                            <Badge variant="outline" className="text-[9px] font-bold text-indigo-700 border-indigo-100 bg-indigo-50/50 uppercase tracking-widest px-2 h-6">
                              {ctrl.itgcDomain || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-[11px] font-bold text-slate-500 py-4">{ctrl.code}</TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col space-y-1">
                              <span className="text-sm font-display font-bold text-slate-900 leading-tight">{ctrl.name}</span>
                              <span className="text-[11px] text-slate-500 line-clamp-1 italic">"{ctrl.description}"</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-4">
                            <Badge className="bg-slate-900 text-white border-none text-[9px] font-bold uppercase tracking-widest px-2.5 h-6">
                              {ctrl.automatedSubNature || 'Manual'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2">
                              <Lock className="h-3 w-3 text-slate-400" />
                              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{ctrl.itApplication || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right px-6 py-4">
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all rounded-xl" onClick={() => handleEditControl(ctrl)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </motion.div>
            </TabsContent>

            {isAdminOrLine2 && (
              <TabsContent value="elc" className="space-y-6 m-0 outline-none">
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between gap-6 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
                    <div className="space-y-2 relative z-10">
                      <h3 className="text-2xl font-display font-bold tracking-tight">RCM Entity Level (ELC)</h3>
                      <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xl">
                        Evaluasi <span className="text-indigo-400 font-bold">17 Prinsip COSO</span> sebagai fondasi utama pengendalian internal perusahaan di seluruh departemen.
                      </p>
                    </div>
                    <Button onClick={() => handleCreateControl({ level: 'ELC' })} className="h-12 gap-3 bg-white text-slate-900 hover:bg-slate-100 shadow-xl transition-all font-bold text-xs uppercase tracking-widest px-8 rounded-2xl relative z-10 shrink-0">
                       <PlusCircle className="h-4 w-4 text-indigo-600" /> Tambah Kontrol Entitas
                    </Button>
                  </div>

                  <div className="border border-slate-200 rounded-[2.5rem] bg-white shadow-2xl shadow-slate-200/50 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                        <TableRow>
                          <TableHead className="w-[350px] font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 px-8 py-6">Prinsip COSO</TableHead>
                          <TableHead className="font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 py-6">Aktivitas Pengendalian & Kebijakan</TableHead>
                          <TableHead className="w-[180px] text-center font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 py-6">Audit Status</TableHead>
                          <TableHead className="w-[100px] px-8 py-6"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {COSO_PRINCIPLES.map((principle) => {
                          const relatedControls = elcControls.filter(c => c.cosoPrinciples?.includes(principle.id as any));
                          const hasGap = relatedControls.length === 0;
                          
                          return (
                            <React.Fragment key={principle.id}>
                              {(principle.id === 1 || principle.id === 6 || principle.id === 10 || principle.id === 13 || principle.id === 16) && (
                                <TableRow className="bg-slate-100/50 border-y border-slate-200/60">
                                  <TableCell colSpan={4} className="py-3 px-8">
                                    <div className="flex items-center gap-3">
                                      <Zap className="h-3.5 w-3.5 text-indigo-500" />
                                      <span className="text-[11px] font-bold uppercase text-slate-900 tracking-[0.25em]">{principle.component}</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                              <TableRow className={cn(
                                "group transition-all duration-300",
                                hasGap ? "bg-rose-50/40 hover:bg-rose-50/60" : "hover:bg-slate-50/50"
                              )}>
                                <TableCell className="align-top py-8 px-8 border-r border-slate-100/50">
                                  <div className="flex gap-4">
                                    <div className={cn(
                                      "h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border-2 transition-all",
                                      hasGap 
                                        ? "bg-rose-100 border-rose-200 text-rose-700 animate-pulse" 
                                        : "bg-indigo-50 border-indigo-100 text-indigo-700"
                                    )}>
                                      {principle.id}
                                    </div>
                                    <div className="space-y-1">
                                       <span className={cn("text-base font-display font-bold leading-tight block", hasGap ? "text-rose-900" : "text-slate-900")}>
                                          {principle.name}
                                       </span>
                                       <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">Prinsip {principle.id}</span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-6 px-6">
                                  <div className="space-y-4">
                                    {relatedControls.length > 0 ? relatedControls.map(ctrl => (
                                      <div key={ctrl.id} className="flex flex-col p-5 border border-slate-100 rounded-2xl bg-white hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-50/50 transition-all group/item relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/30 rounded-full -mr-12 -mt-12 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                        <div className="flex justify-between items-start relative z-10">
                                          <div className="flex items-center gap-3">
                                             <Badge variant="outline" className="text-[9px] font-mono h-5 border-indigo-100 bg-indigo-50/30 text-indigo-600 font-bold">{ctrl.code || 'ELC'}</Badge>
                                             <span className="text-sm font-bold text-slate-800">{ctrl.name}</span>
                                          </div>
                                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover/item:opacity-100 group-hover:bg-slate-100 transition-all rounded-lg" onClick={() => handleEditControl(ctrl)}>
                                            <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                                          </Button>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-2.5 line-clamp-2 leading-relaxed italic font-medium">"{ctrl.description}"</p>
                                        <div className="flex items-center gap-6 mt-5 relative z-10">
                                           <div className="flex items-center gap-2">
                                              <Target className="h-3.5 w-3.5 text-slate-400" />
                                              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{ctrl.frequency}</span>
                                           </div>
                                           {ctrl.attachmentUrl && (
                                             <div className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 cursor-pointer">
                                               <FileDown className="h-4 w-4" />
                                               <span className="text-[10px] font-bold uppercase tracking-widest">Policy Doc</span>
                                             </div>
                                           )}
                                        </div>
                                      </div>
                                    )) : (
                                      <div className="flex flex-col items-center justify-center py-6 px-4 bg-rose-50/30 border border-dashed border-rose-200 rounded-2xl">
                                         <ShieldAlert className="h-6 w-6 text-rose-400 mb-2" />
                                         <span className="text-[11px] text-rose-500 font-bold uppercase tracking-widest text-center">Risiko: Belum ada kebijakan yang dipetakan</span>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center py-6">
                                   {relatedControls.length > 0 ? (
                                     <div className="flex flex-col items-center gap-1.5">
                                        <Badge className="bg-emerald-500 text-white border-none font-bold text-[9px] uppercase tracking-widest px-3 h-6 shadow-sm shadow-emerald-100">Mapped</Badge>
                                        <span className="text-[9px] font-bold text-emerald-600 uppercase">Effective</span>
                                     </div>
                                   ) : (
                                     <div className="flex flex-col items-center gap-1.5">
                                        <Badge className="bg-rose-500 text-white border-none font-bold text-[9px] uppercase tracking-widest px-3 h-6 animate-pulse">Critical Gap</Badge>
                                        <span className="text-[9px] font-bold text-rose-600 uppercase">Remediation Needed</span>
                                     </div>
                                   )}
                                </TableCell>
                                <TableCell className="text-right py-6 pr-8">
                                   <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-10 w-10 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-2xl" 
                                    onClick={() => handleCreateControl({ level: 'ELC', cosoPrinciples: [principle.id as any], name: `Kontrol Prinsip ${principle.id}` })}
                                   >
                                      <PlusCircle className="h-5 w-5" />
                                   </Button>
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </motion.div>
              </TabsContent>
            )}

            <TabsContent value="wbs" className="space-y-6 m-0 outline-none">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm"
              >
                <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                  <ShieldAlert className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-display font-bold text-slate-900">Whistleblowing Integration</h3>
                <p className="text-slate-500 text-sm font-medium mt-1 max-w-sm text-center">
                  Fitur integrasi laporan WBS sedang dipersiapkan untuk sinkronisasi otomatis indikator kecurangan (fraud) dengan profil risiko RCM.
                </p>
                <Button variant="outline" className="mt-8 font-bold text-xs uppercase tracking-widest px-6 h-10 border-indigo-100 text-indigo-600 hover:bg-indigo-50 rounded-xl">
                  Pelajari Lebih Lanjut
                </Button>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>

      <ControlEditor isOpen={isEditorOpen} setIsOpen={handleCloseEditor} control={selectedControl} />
    </AppLayout>
  );
}
