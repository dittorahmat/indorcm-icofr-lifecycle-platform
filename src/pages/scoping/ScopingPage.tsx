import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Plus, Trash2, Upload, Database, LayoutGrid, CheckCircle2, AlertTriangle, PanelLeftOpen
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
      <div className="space-y-6">
        <PageHeader 
          title={t('scoping:title')} 
          description={t('scoping:description')}
          badge={activeSnapshot && (
            <Badge variant="outline" className={cn(
              "gap-1.5 font-bold transition-colors",
              activeSnapshot.status === 'Mapped' 
                ? "bg-green-50 text-green-700 border-green-200" 
                : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
            )}>
              <CheckCircle2 className="h-3.5 w-3.5" /> 
              {t('scoping:activeSource')}: {activeSnapshot.filename} ({activeSnapshot.status})
            </Badge>
          )}
        >
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-2">
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[100px] bg-white">
                  <SelectValue placeholder={t('common:placeholders.year')} />
                </SelectTrigger>
                <SelectContent>
                  {dynamicYears.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <Button variant="outline" className="gap-2 border-dashed border-2 hover:border-primary hover:bg-primary/5">
                  <Upload className="h-4 w-4" /> {t('scoping:uploadButton')}
                </Button>
              </div>
              <Button 
                onClick={() => setIsCreating(true)} 
                className="gap-2 shadow-lg shadow-primary/20" 
                disabled={!activeSnapshot || activeSnapshot.status !== 'Mapped'}
              >
                <Plus className="h-4 w-4" /> {t('scoping:simulation.createNew')}
              </Button>
            </div>
            {!activeSnapshot && <p className="text-[10px] text-muted-foreground italic">{t('scoping:emptyState')}</p>}
          </div>
        </PageHeader>

        <Tabs defaultValue="simulations" className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-6">
            <TabsTrigger value="simulations" className="gap-2">
              <LayoutGrid className="h-4 w-4" /> {t('scoping:simulation.title')}
            </TabsTrigger>
            <TabsTrigger value="master-gl" className="gap-2">
              <Database className="h-4 w-4" /> {t('scoping:masterDataTab')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simulations">
            <SimulationListTable 
              data={simulations} 
              onSelect={(id) => setSearchParams({ id })} 
              onDelete={mutations.deleteSim.mutate} 
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="master-gl">
            <div className="flex justify-end mb-4">
              <Button 
                variant="destructive" 
                size="sm" 
                className="gap-2 opacity-50 hover:opacity-100 transition-opacity"
                onClick={() => {
                  if (confirm(t('scoping:purgeConfirm'))) {
                    api('/api/dev/purge-scoping', { method: 'DELETE' }).then(() => {
                      queryClient.invalidateQueries();
                      toast.success(t('common:notifications.purged'));
                    });
                  }
                }}
              >
                <Trash2 className="h-4 w-4" /> {t('scoping:resetDataButton')}
              </Button>
            </div>
            <GLSourceTable 
              data={snapshots} 
              onSetActive={mutations.setActiveSnap.mutate}
              onSetBenchmark={setBenchmarkModalSnap}
              onDelete={mutations.deleteSnap.mutate}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('scoping:simulation.createNew')}</DialogTitle>
              <DialogDescription>
                {t('scoping:simulation.basisDescription', { filename: activeSnapshot?.filename })}
              </DialogDescription>
            </DialogHeader>
            <ScopingSimulationForm 
              activeSnap={activeSnapshot || null}
              onSubmit={(data) => mutations.createSim.mutate({ ...data, glSnapshotId: activeSnapshot?.id })} 
              isPending={mutations.createSim.isPending}
              yearOptions={dynamicYears}
            />
          </DialogContent>
        </Dialog>

        <SetBenchmarkModal 
          snapshot={benchmarkModalSnap} 
          isOpen={!!benchmarkModalSnap} 
          onOpenChange={(open) => !open && setBenchmarkModalSnap(null)} 
        />
      </div>
    </AppLayout>
  );
}

function ScopingEditor({ simulation, onBack }: { simulation: MaterialitySimulation, onBack: () => void }) {
  const { t } = useTranslation('scoping');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const {
    simState, setSimState, mergedGlData, omValue, pmValue, multiplier, benchmarkValue,
    departments, applications, localAppMappings, isLocked, mutations, handlers
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
        />

        <div className="flex gap-6 items-start">
          <AnimatePresence initial={false}>
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ width: 0, opacity: 0, x: -50 }}
                animate={{ width: 300, opacity: 1, x: 0 }}
                exit={{ width: 0, opacity: 0, x: -50 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
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

                <Card className="bg-amber-50 border-amber-200 shadow-sm w-[300px] p-4">
                   <h3 className="text-[10px] uppercase font-bold text-amber-800 flex items-center gap-2 mb-2">
                     <AlertTriangle className="h-3 w-3" /> {t('logic.title')}
                   </h3>
                   <div className="text-[10px] text-amber-700 leading-relaxed space-y-2 italic">
                    <p>{t('logic.description')}</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>{t('logic.quant')}</li>
                      <li>{t('logic.qual')}</li>
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
              className="mt-2 shrink-0 bg-white shadow-sm border-indigo-100 text-indigo-600 hover:bg-indigo-50"
              onClick={() => setIsSidebarCollapsed(false)}
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          )}

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
    </AppLayout>
  );
}
