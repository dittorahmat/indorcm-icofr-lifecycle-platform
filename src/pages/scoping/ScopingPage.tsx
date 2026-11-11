import React from 'react';
import { motion, Variants } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Upload, Database, LayoutGrid } from 'lucide-react';
import { GLSourceTable } from '@/components/scoping/GLSourceTable';
import { SimulationListTable } from '@/components/scoping/SimulationListTable';
import { SetBenchmarkModal } from '@/components/scoping/SetBenchmarkModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConfirm } from '@/hooks/use-confirm';
import { usePurgeScoping } from './use-purge-scoping';
import { PageHeader } from '@/components/layout/PageHeader';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { resolveSimulationStatus } from '@shared/scoping-simulation-status';

import { SmartImportWizard } from '@/components/scoping/SmartImportWizard';
import { RolloverPrompt } from '@/components/layout/RolloverPrompt';
import { RolloverCard } from '@/components/layout/RolloverCard';

// New Decomposed Parts
import { useScopingPage } from './hooks/useScopingPage';
import { ScopingSimulationForm } from './components/ScopingSimulationForm';
import { ScopingEditor } from './components/ScopingEditorShell';
import { ScopingHeaderBanner } from './components/ScopingHeaderBanner';
import { MaterialityKpiCards } from './components/MaterialityKpiCards';

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
  const { workingYear } = useFiscalYearStore();
  const queryClient = useQueryClient();
  const {
    selectedSimId, setSearchParams,
    isCreating, setIsCreating, benchmarkModalSnap, setBenchmarkModalSnap,
    simulations, snapshots, activeSnapshot, isLoading,
    mutations
  } = useScopingPage();

  const confirm = useConfirm();
  const { purgeScoping } = usePurgeScoping();
  const [isImportWizardOpen, setIsImportWizardOpen] = React.useState(false);
  const [isRolloverOpen, setIsRolloverOpen] = React.useState(false);

  const handleDeleteSim = async (id: string) => {
    const sim = simulations.find(s => s.id === id);
    if (!sim) return;

    if (resolveSimulationStatus(sim) === 'Approved') {
      const ok = await confirm({
        title: t('scoping:delete.requestDeletionTitle'),
        description: t('scoping:delete.requestDeletionDesc', { name: sim.name }),
        variant: 'destructive',
        confirmText: t('common:actions.submit', { defaultValue: 'Submit Request' }),
      });
      if (ok) mutations.requestDeleteSim.mutate(id);
      return;
    }

    const ok = await confirm({
      title: t('scoping:delete.simTitle'),
      description: t('scoping:delete.simDesc', { name: sim.name }),
      variant: 'destructive'
    });
    if (ok) mutations.deleteSim.mutate(id);
  };

  const handleDeleteSnap = async (id: string) => {
    const snap = snapshots.find(s => s.id === id);
    const ok = await confirm({
      title: t('scoping:delete.snapTitle'),
      description: t('scoping:delete.snapDesc', { name: snap?.filename || '' }),
      variant: 'destructive'
    });
    if (ok) mutations.deleteSnap.mutate(id);
  };

  // A snapshot is only ready to base a simulation on when a benchmark FSLI
  // exists, not merely when its status reads "Mapped" (legacy rows can lie).
  const hasBenchmark = !!activeSnapshot?.benchmarkFsliNames?.length;

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
              "gap-1.5 font-bold uppercase tracking-wider text-xs transition-all px-2.5 py-1 shadow-sm ring-1 ring-slate-200/50",
              activeSnapshot.status === 'Mapped' 
                ? "bg-white text-emerald-700 border-emerald-200" 
                : "bg-white text-amber-700 border-amber-200"
            )}>
              <div className={cn("h-1.5 w-1.5 rounded-full", activeSnapshot.status === 'Mapped' ? "bg-emerald-500" : "bg-amber-500")} />
              {activeSnapshot.filename}
            </Badge>
          )}
        >
          <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
            <div className="flex flex-col min-[380px]:flex-row gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="h-11 sm:h-10 min-h-[44px] sm:min-h-0 w-full sm:w-auto justify-center gap-2 border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-wider shadow-sm"
                onClick={() => setIsImportWizardOpen(true)}
              >
                <Upload className="h-3.5 w-3.5 text-slate-500" /> {t('scoping:uploadButton')}
              </Button>
              <Button 
                onClick={() => setIsCreating(true)} 
                className="h-11 sm:h-10 min-h-[44px] sm:min-h-0 w-full sm:w-auto justify-center gap-2 bg-mancity-pattern text-primary-foreground hover:opacity-90 shadow-md shadow-blue-100 transition-all font-bold text-xs uppercase tracking-wider border-none" 
                disabled={!activeSnapshot || activeSnapshot.status !== 'Mapped' || !hasBenchmark}
              >
                <Plus className="h-3.5 w-3.5" /> {t('scoping:simulation.createNew')}
              </Button>
            </div>
            {!activeSnapshot && <p className="text-xs font-bold text-rose-500 uppercase tracking-[0.1em]">{t('scoping:emptyState')}</p>}
            {activeSnapshot && !hasBenchmark && (
              <p className="text-xs font-bold text-amber-600 uppercase tracking-[0.1em]">{t('scoping:noBenchmarks')}</p>
            )}
          </div>
        </PageHeader>

        {/* 1. Sovereign Governance Scoping Header Banner */}
        <motion.div variants={itemVariants}>
          <ScopingHeaderBanner
            workingYear={workingYear}
            activeSnapshotFilename={activeSnapshot?.filename}
            hasBenchmark={hasBenchmark}
          />
        </motion.div>

        {/* 2. Materiality Benchmarks & KPIs Ribbon */}
        {(() => {
          const latestSim = simulations[0];
          const om = latestSim?.omValue ?? 125000000000;
          const pm = latestSim?.pmValue ?? 87500000000;
          const omPct = latestSim?.omPercentage ?? 1.0;
          const hcPct = latestSim?.haircutPercentage ?? 25;
          const basis = latestSim?.basis ?? (activeSnapshot?.benchmarkFsliNames?.[0] || 'Total Assets');
          return (
            <motion.div variants={itemVariants}>
              <MaterialityKpiCards
                omValue={om}
                pmValue={pm}
                omPercentage={omPct}
                haircutPercentage={hcPct}
                basisName={basis}
              />
            </motion.div>
          );
        })()}

        {simulations.length === 0 && snapshots.length === 0 && !isLoading && (
          <motion.div variants={itemVariants}>
            <RolloverCard workingYear={workingYear} onOpen={() => setIsRolloverOpen(true)} />
          </motion.div>
        )}

        <Tabs defaultValue="simulations" className="w-full">
          <div className="overflow-x-auto max-w-full touch-pan-x overscroll-x-contain no-scrollbar -mx-1 px-1 mb-8">
          <TabsList className="flex sm:grid w-max min-w-full sm:w-full sm:max-w-[440px] sm:grid-cols-2 bg-slate-100/50 p-1 border border-slate-200 rounded-lg shadow-inner min-h-[44px] gap-1">
            <TabsTrigger value="simulations" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest py-2 px-4 min-h-[44px] flex items-center justify-center flex-1 sm:flex-none whitespace-nowrap min-w-[160px] sm:min-w-0">
              <LayoutGrid className="h-4 w-4" /> {t('scoping:simulation.title')}
            </TabsTrigger>
            <TabsTrigger value="master-gl" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest py-2 px-4 min-h-[44px] flex items-center justify-center flex-1 sm:flex-none whitespace-nowrap min-w-[160px] sm:min-w-0">
              <Database className="h-4 w-4" /> {t('scoping:masterDataTab')}
            </TabsTrigger>
          </TabsList>
          </div>

          <TabsContent value="simulations">
            <motion.div variants={itemVariants}>
              <SimulationListTable 
                data={simulations} 
                onSelect={(id) => setSearchParams({ id })} 
                onDelete={handleDeleteSim} 
                isLoading={isLoading}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="master-gl">
            <motion.div variants={itemVariants}>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mb-4">
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2 h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-auto font-bold text-xs uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-all shadow-none rounded-md"
                  onClick={() => void purgeScoping()}
                >
                  <Trash2 className="h-3.5 w-3.5" /> {t('scoping:resetDataButton')}
                </Button>
              </div>
              <GLSourceTable 
                data={snapshots} 
                onSetActive={mutations.setActiveSnap.mutate}
                onSetBenchmark={setBenchmarkModalSnap}
                onDelete={handleDeleteSnap}
                isLoading={isLoading}
              />
            </motion.div>
          </TabsContent>
        </Tabs>

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="sm:max-w-[425px] w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto border-none shadow-2xl rounded-lg p-0 ring-1 ring-primary/20">
            <div className="bg-mancity-pattern p-4 sm:p-6 text-primary-foreground">
              <DialogHeader>
                <DialogTitle className="font-display font-extrabold text-2xl tracking-tight uppercase">{t('scoping:simulation.createNew')}</DialogTitle>
                <DialogDescription className="text-primary-foreground/70 text-xs font-bold uppercase tracking-wider">
                  {t('scoping:simulation.basisDescription', { filename: activeSnapshot?.filename })}
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-4 sm:p-6">
              <ScopingSimulationForm 
                activeSnap={activeSnapshot || null}
                onSubmit={(data) => mutations.createSim.mutate({ ...data, glSnapshotId: activeSnapshot?.id })} 
                isPending={mutations.createSim.isPending}
                defaultYear={workingYear}
              />
            </div>
          </DialogContent>
        </Dialog>

        <SetBenchmarkModal 
          snapshot={benchmarkModalSnap} 
          isOpen={!!benchmarkModalSnap} 
          onOpenChange={(open) => !open && setBenchmarkModalSnap(null)} 
        />

        <SmartImportWizard 
          isOpen={isImportWizardOpen} 
          onOpenChange={setIsImportWizardOpen}
          onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['simulations'] });
              queryClient.invalidateQueries({ queryKey: ['gl-snapshots'] });
          }}
        />

        <RolloverPrompt 
          isOpen={isRolloverOpen}
          onClose={() => setIsRolloverOpen(false)}
          onConfirm={() => {
            mutations.rollover.mutate({
              sourceYear: (parseInt(workingYear) - 1).toString(),
              targetYear: workingYear
            }, {
              onSuccess: () => {
                setIsRolloverOpen(false);
              }
            });
          }}
          year={workingYear}
          prevYear={(parseInt(workingYear) - 1).toString()}
          isLoading={mutations.rollover.isPending}
        />

      </motion.div>
    </AppLayout>
  );
}
