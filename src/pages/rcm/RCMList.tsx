import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { Control, User } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileDown, ShieldAlert } from 'lucide-react';
import { ControlEditor } from '@/components/rcm/ControlEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TLCTabContent } from '@/components/rcm/TLCTabContent';
import { ITGCTabContent } from '@/components/rcm/ITGCTabContent';
import { ELCTabContent } from '@/components/rcm/ELCTabContent';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';

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
  const { t } = useTranslation(['rcm', 'common']);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = React.useState('');
  const { workingYear } = useFiscalYearStore();

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

  // 1. Fetch Controls (with year filtering if needed, though list might show all or be filtered by tab)
  const { data: controlsData, isLoading: controlsLoading } = useQuery({
    queryKey: ['controls', workingYear],
    queryFn: () => api<{ items: Control[] }>(`/api/controls?year=${workingYear}`),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api<User>('/api/user/me'),
  });

  const isAdminOrLine2 = currentUser?.role === 'Admin' || currentUser?.role === 'Line 2';

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
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6 min-w-0 max-w-full">
          <div className="space-y-2 min-w-0 max-w-full">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold tracking-tight text-slate-900 leading-none break-words">Risk Control Matrix</h1>
            <p className="text-slate-500 text-sm font-medium max-w-2xl leading-relaxed">
              {t('matrix.subtitle_tlc')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
            <Button variant="outline" className="h-11 sm:h-10 min-h-[44px] sm:min-h-0 gap-2 border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all font-bold text-xs uppercase tracking-widest px-5 w-full sm:w-auto justify-center">
              <FileDown className="h-4 w-4 text-indigo-500" /> {t('common:actions.all')} RCM
            </Button>
          </div>
        </motion.div>

        <Tabs defaultValue="tlc" className="w-full">
          <motion.div variants={itemVariants} className="bg-slate-100/50 p-1 border border-slate-200 rounded-lg max-w-full overflow-x-auto touch-pan-x overscroll-x-contain mb-8 no-scrollbar">
            <TabsList className="bg-transparent h-auto p-0 flex gap-1 w-max min-w-full">
              {[
                { value: 'tlc', label: `TLC (${t('common:icofr.tlc')})`, count: tlcControls.length },
                { value: 'elc', label: `ELC (${t('common:icofr.elc')})`, count: elcControls.length, hidden: !isAdminOrLine2 },
                { value: 'itgc', label: 'ITGC (IT General)', count: itgcControls.length },
                { value: 'wbs', label: 'WBS Integration', count: 0 },
              ].filter(t => !t.hidden).map((tab) => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value} 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-indigo-600 transition-all font-bold text-xs uppercase tracking-widest py-3 px-6 min-h-[44px] text-slate-500 flex items-center gap-2.5 whitespace-nowrap"
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
              <TLCTabContent 
                filteredTlc={filteredTlc}
                controlsLoading={controlsLoading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onEditControl={handleEditControl}
              />
            </TabsContent>

            <TabsContent value="itgc" className="space-y-6 m-0 outline-none">
              <ITGCTabContent 
                filteredItgc={filteredItgc}
                controlsLoading={controlsLoading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onEditControl={handleEditControl}
              />
            </TabsContent>

            {isAdminOrLine2 && (
              <TabsContent value="elc" className="space-y-6 m-0 outline-none">
                <ELCTabContent 
                  elcControls={elcControls}
                  onEditControl={handleEditControl}
                  onCreateControl={handleCreateControl}
                />
              </TabsContent>
            )}

            <TabsContent value="wbs" className="space-y-6 m-0 outline-none">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-lg shadow-sm"
              >
                <div className="h-16 w-16 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
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
