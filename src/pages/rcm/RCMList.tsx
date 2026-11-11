import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { Control } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileDown, ShieldAlert, Compass, Table as TableIcon } from 'lucide-react';
import { ControlEditor } from '@/components/rcm/ControlEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TLCTabContent } from '@/components/rcm/TLCTabContent';
import { ITGCTabContent } from '@/components/rcm/ITGCTabContent';
import { ELCTabContent } from '@/components/rcm/ELCTabContent';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { useCurrentRole } from '@/hooks/use-current-role';
import { can } from '@shared/entity-authority';
import { RCMKeyControlExplorer } from '@/components/rcm/key-controls/RCMKeyControlExplorer';

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
  const userRole = useCurrentRole();

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

  const { data: controlsData, isLoading: controlsLoading } = useQuery({
    queryKey: ['controls', workingYear],
    queryFn: () => api<{ items: Control[] }>(`/api/controls?year=${workingYear}`),
  });

  const canManageControls = can(userRole, 'rcm:manage-controls');

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
        className="flex flex-col space-y-6 pb-10"
      >
        <Tabs defaultValue="explorer" className="w-full">
          <motion.div variants={itemVariants} className="bg-slate-100/50 p-1 border border-slate-200 rounded-lg max-w-full overflow-x-auto touch-pan-x overscroll-x-contain mb-6 no-scrollbar">
            <TabsList className="bg-transparent h-auto p-0 flex gap-1 w-max min-w-full">
              {[
                { value: 'explorer', label: t('explorer.tabs.keyControlsExplorer', { defaultValue: 'Key Control Explorer' }), count: tlcControls.filter(c => c.isKeyControl).length, icon: Compass },
                { value: 'tlc', label: `TLC (${t('common:icofr.tlc')})`, count: tlcControls.length },
                { value: 'elc', label: `ELC (${t('common:icofr.elc')})`, count: elcControls.length, hidden: !canManageControls },
                { value: 'itgc', label: 'ITGC (IT General)', count: itgcControls.length },
                { value: 'wbs', label: 'WBS Integration', count: 0 },
              ].filter(tab => !tab.hidden).map((tab) => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value} 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all font-bold text-xs uppercase tracking-wider py-2.5 px-5 min-h-[44px] text-slate-500 flex items-center gap-2 whitespace-nowrap"
                >
                  {tab.icon && <tab.icon className="h-4 w-4 shrink-0 text-secondary" />}
                  <span>{tab.label}</span>
                  <Badge className="bg-slate-200/50 text-slate-500 group-data-[state=active]:bg-secondary/15 group-data-[state=active]:text-secondary border-none px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center font-mono text-xs">
                    {tab.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </motion.div>

          <AnimatePresence mode="wait">
            <TabsContent value="explorer" className="space-y-6 m-0 outline-none">
              <RCMKeyControlExplorer workingYear={workingYear} />
            </TabsContent>

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

            {canManageControls && (
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
                <div className="h-16 w-16 bg-primary-container/10 rounded-lg flex items-center justify-center mb-4">
                  <ShieldAlert className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-display font-bold text-slate-900">Whistleblowing Integration</h3>
                <p className="text-slate-500 text-sm font-medium mt-1 max-w-sm text-center">
                  Fitur integrasi laporan WBS sedang dipersiapkan untuk sinkronisasi otomatis indikator kecurangan (fraud) dengan profil risiko RCM.
                </p>
                <Button variant="outline" className="mt-8 font-bold text-xs uppercase tracking-widest px-6 h-10 border-slate-200 text-primary hover:bg-slate-50 rounded-lg">
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
