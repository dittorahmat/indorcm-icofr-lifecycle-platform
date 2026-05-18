import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Plus, Trash2, Upload, Database, LayoutGrid, CheckCircle2, AlertTriangle, PanelLeftOpen,
  Calendar, ArrowRight
} from 'lucide-react';
import { GLSourceTable } from '@/components/scoping/GLSourceTable';
import { SimulationListTable } from '@/components/scoping/SimulationListTable';
import { SetBenchmarkModal } from '@/components/scoping/SetBenchmarkModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from '@/components/layout/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';

// New Decomposed Parts
import { useScopingPage, useScopingEditor } from './hooks/useScopingPage';
import { parseGLFile } from './services/gl-parser';
import { MaterialityParamsCard } from './components/MaterialityParamsCard';
import { ScopingSimulationForm } from './components/ScopingSimulationForm';
import { ScopingEditorHeader } from './components/ScopingEditorHeader';
import { ScopingEditorContent } from './components/ScopingEditorContent';

import type { MaterialitySimulation } from '@shared/types';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 12, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1] // ease-out-expo
    }
  }
};

export function ScopingPage() {
  const { t } = useTranslation(['scoping', 'common']);
  const queryClient = useQueryClient();
  const {
    selectedSimId, setSearchParams, filterYear, setFilterYear,
    isCreating, setIsCreating, benchmarkModalSnap, setBenchmarkModalSnap,
    simulations, snapshots, activeSnapshot, isLoading,
    mutations
  } = useScopingPage();

  const currentYear = new Date().getFullYear();
  const dynamicYears = React.useMemo(() => {
    const years = [];
    for (let y = 2024; y <= currentYear + 1; y++) years.push(y.toString());
    return years;
  }, [currentYear]);

  const onDrop = React.useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const result = await parseGLFile(file);
    if (result.success) {
      mutations.uploadSnap.mutate({ filename: file.name, rows: result.rows });
    } else {
      toast.error(result.error || t('common:notifications.error'));
    }
  }, [mutations.uploadSnap, t]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  if (selectedSimId) {
    const sim = simulations.find(s => s.id === selectedSimId);
    if (sim) return <ScopingEditor simulation={sim} onBack={() => setSearchParams({})} />;
  }

  return (
    <AppLayout container>
      <motion.div 
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <PageHeader 
          title={<span className="font-display font-extrabold tracking-tight text-slate-900">{t('scoping:title')}</span>} 
          description={t('scoping:description')}
          badge={activeSnapshot && (
            <Badge variant="outline" className={cn(
              "gap-1.5 font-bold uppercase tracking-wider text-[10px] transition-all px-2.5 py-1 shadow-sm ring-1 ring-slate-200/50",
              activeSnapshot.status === 'Mapped' 
                ? "bg-white text-emerald-700 border-emerald-200" 
                : "bg-white text-amber-700 border-amber-200"
            )}>
              <div className={cn("h-1.5 w-1.5 rounded-full", activeSnapshot.status === 'Mapped' ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse")} />
              {activeSnapshot.filename}
            </Badge>
          )}
        >
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[110px] h-10 bg-white border-slate-200 text-xs font-bold uppercase tracking-wider shadow-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <SelectValue placeholder={t('common:placeholders.year')} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {dynamicYears.map(y => (
                    <SelectItem key={y} value={y} className="text-xs font-bold uppercase">{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <Button variant="outline" className="h-10 gap-2 border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-wider shadow-sm">
                  <Upload className="h-3.5 w-3.5 text-slate-500" /> {t('scoping:uploadButton')}
                </Button>
              </div>
              <Button 
                onClick={() => setIsCreating(true)} 
                className="h-10 gap-2 bg-mancity-pattern text-primary-foreground hover:opacity-90 shadow-md shadow-blue-100 transition-all font-bold text-xs uppercase tracking-wider border-none" 
                disabled={!activeSnapshot || activeSnapshot.status !== 'Mapped'}
              >
                <Plus className="h-3.5 w-3.5" /> {t('scoping:simulation.createNew')}
              </Button>
            </div>
            {!activeSnapshot && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-[0.1em]">{t('scoping:emptyState')}</p>}
          </div>
        </PageHeader>

        <Tabs defaultValue="simulations" className="w-full">
          <TabsList className="grid w-full max-w-[440px] grid-cols-2 mb-8 bg-slate-100/50 p-1 border border-slate-200 rounded-xl shadow-inner">
            <TabsTrigger value="simulations" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest py-2">
              <LayoutGrid className="h-4 w-4" /> {t('scoping:simulation.title')}
            </TabsTrigger>
            <TabsTrigger value="master-gl" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest py-2">
              <Database className="h-4 w-4" /> {t('scoping:masterDataTab')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simulations">
            <motion.div variants={itemVariants}>
              <SimulationListTable 
                data={simulations} 
                onSelect={(id) => setSearchParams({ id })} 
                onDelete={mutations.deleteSim.mutate} 
                isLoading={isLoading}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="master-gl">
            <motion.div variants={itemVariants}>
              <div className="flex justify-end mb-4">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="gap-2 h-8 font-bold text-[10px] uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-all shadow-none rounded-md"
                  onClick={() => {
                    if (confirm(t('scoping:purgeConfirm'))) {
                      api('/api/dev/purge-scoping', { method: 'DELETE' }).then(() => {
                        queryClient.invalidateQueries();
                        toast.success(t('common:notifications.purged'));
                      });
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> {t('scoping:resetDataButton')}
                </Button>
              </div>
              <GLSourceTable 
                data={snapshots} 
                onSetActive={mutations.setActiveSnap.mutate}
                onSetBenchmark={setBenchmarkModalSnap}
                onDelete={mutations.deleteSnap.mutate}
                isLoading={isLoading}
              />
            </motion.div>
          </TabsContent>
        </Tabs>

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="sm:max-w-[425px] border-none shadow-2xl rounded-2xl overflow-hidden p-0 ring-1 ring-primary/20">
            <div className="bg-mancity-pattern p-6 text-primary-foreground">
              <DialogHeader>
                <DialogTitle className="font-display font-extrabold text-2xl tracking-tight uppercase">{t('scoping:simulation.createNew')}</DialogTitle>
                <DialogDescription className="text-primary-foreground/70 text-xs font-bold uppercase tracking-wider">
                  {t('scoping:simulation.basisDescription', { filename: activeSnapshot?.filename })}
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6">
              <ScopingSimulationForm 
                activeSnap={activeSnapshot || null}
                onSubmit={(data) => mutations.createSim.mutate({ ...data, glSnapshotId: activeSnapshot?.id })} 
                isPending={mutations.createSim.isPending}
                yearOptions={dynamicYears}
              />
            </div>
          </DialogContent>
        </Dialog>

        <SetBenchmarkModal 
          snapshot={benchmarkModalSnap} 
          isOpen={!!benchmarkModalSnap} 
          onOpenChange={(open) => !open && setBenchmarkModalSnap(null)} 
        />
      </motion.div>
    </AppLayout>
  );
}

function ScopingEditor({ simulation, onBack }: { simulation: MaterialitySimulation, onBack: () => void }) {
  const { t } = useTranslation('scoping');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const {
    simState, setSimState, mergedGlData, omValue, pmValue, multiplier, benchmarkValue,
    departments, applications, localAppMappings, isLocked, mutations, handlers, isDirty
  } = useScopingEditor(simulation);

  const handleOwnerAcceptanceChange = async (noGL: string, acceptance: "Accepted" | "Rejected") => {
    if (isLocked) return;
    try {
      await api(`/api/gl-rows/${noGL}/owner-acceptance`, { method: 'PUT', body: JSON.stringify({ ownerAcceptance: acceptance }) });
      toast.success(`Owner acceptance updated to ${acceptance}`);
    } catch (error) {
      toast.error("Failed to update owner acceptance");
    }
  };

  const handleQuickAddApp = async (name: string, accountCode: string) => {
     // For now, delegate to existing logic if any, or implement simple version
     toast.info("Add application functionality extracted to component props");
  };

  return (
    <AppLayout container>
      <div className="space-y-6 pb-20">
        <ScopingEditorHeader 
          simState={simState}
          isLocked={isLocked}
          onBack={onBack}
          onSave={() => mutations.save.mutate(simState)}
          onSubmit={() => mutations.submit.mutate()}
          isSaving={mutations.save.isPending}
          isSubmitting={mutations.submit.isPending}
          omValue={omValue}
          pmValue={pmValue}
        />

        <div className="flex gap-6 items-start">
          <AnimatePresence initial={false}>
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ width: 0, opacity: 0, x: -30 }}
                animate={{ width: 300, opacity: 1, x: 0 }}
                exit={{ width: 0, opacity: 0, x: -30 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="shrink-0 space-y-6 overflow-hidden"
              >
                <MaterialityParamsCard 
                  simState={simState}
                  setSimState={setSimState}
                  multiplier={multiplier}
                  benchmarkValue={benchmarkValue}
                  omValue={omValue}
                  pmValue={pmValue}
                  isLocked={isLocked}
                  onCollapse={() => setIsSidebarCollapsed(true)}
                />

                <Card className="relative overflow-hidden bg-slate-50 border-slate-200 shadow-sm w-[300px] p-5 ring-1 ring-slate-100">
                   <h3 className="text-[10px] uppercase font-black text-slate-800 tracking-widest flex items-center gap-2 mb-4">
                     <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> {t('logic.title')}
                   </h3>
                   <div className="text-[11px] text-slate-600 leading-relaxed space-y-4 font-medium">
                    <p>{t('logic.description')}</p>
                    <ol className="space-y-3">
                      <li className="flex gap-3">
                        <Badge className="h-4 w-4 p-0 flex items-center justify-center rounded-full bg-slate-900 border-none text-white text-[9px] font-black">1</Badge>
                        <span>{t('logic.quant')}</span>
                      </li>
                      <li className="flex gap-3">
                        <Badge className="h-4 w-4 p-0 flex items-center justify-center rounded-full bg-slate-900 border-none text-white text-[9px] font-black">2</Badge>
                        <span>{t('logic.qual')}</span>
                      </li>
                    </ol>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {isSidebarCollapsed && (
            <Button
              variant="outline"
              size="icon"
              className="mt-2 shrink-0 h-10 w-10 bg-white shadow-md border-indigo-100 text-indigo-600 hover:bg-indigo-50 transition-all rounded-xl"
              onClick={() => setIsSidebarCollapsed(false)}
            >
              <PanelLeftOpen className="h-5 w-5" />
            </Button>
          )}

          <div className="flex-1 overflow-hidden">
            <ScopingEditorContent 
              simState={simState}
              mergedGlData={mergedGlData}
              omValue={omValue}
              pmValue={pmValue}
              isLocked={isLocked}
              departments={departments}
              applications={applications}
              selectedApps={localAppMappings}
              onAssessmentChange={handlers.onAssessmentChange}
              onOwnerAcceptanceChange={handleOwnerAcceptanceChange}
              onAssignDepartments={handlers.onAssignDepartments}
              onAppsChange={handlers.onAppsChange}
              onQuickAddApp={handleQuickAddApp}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
