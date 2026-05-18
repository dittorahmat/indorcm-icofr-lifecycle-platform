import React, { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import type { Deficiency, ActionPlan, ActionPlanStatus, DeficiencySeverity, AggregateDeficiency, MaterialitySimulation } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { DeficiencyCard } from '@/components/deficiencies/DeficiencyCard';
import { toast } from 'sonner';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  AlertTriangle, ShieldAlert, Layers, Plus, CheckCircle2, 
  Search, Kanban, Filter, UserCheck, ChevronRight, Settings2,
  Clock, AlertCircle, FileText, Zap, ShieldCheck, Send, XCircle
} from 'lucide-react';
import { DoDWizard } from '@/components/deficiencies/DoDWizard';
import { RemediationForm } from '@/components/deficiencies/RemediationForm';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const KANBAN_COLUMNS: string[] = ["Ineffective", "In Review", "In Approval", "Resolved"];

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

function KanbanColumn({ 
  status, 
  deficiencies, 
  actionPlans, 
  onAssess,
  onEditPlan,
  isSelectionMode,
  selectedIds,
  onToggleSelect,
  role,
  onStatusChange
}: { 
  status: string; 
  deficiencies: Deficiency[]; 
  actionPlans: ActionPlan[], 
  onAssess: (dId: string) => void,
  onEditPlan: (plan: ActionPlan) => void,
  isSelectionMode: boolean,
  selectedIds: string[],
  onToggleSelect: (id: string) => void,
  role: string,
  onStatusChange: (apId: string, action: string) => void
}) {
  const { t } = useTranslation('deficiency');
  const plansInColumn = actionPlans.filter(ap => (ap.workflowStatus || ap.status) === status);

  const getColumnConfig = (s: string) => {
    switch (s) {
      case 'Ineffective': return { title: "Ineffective", color: 'text-slate-400', bg: 'bg-slate-100', icon: FileText };
      case 'In Review': return { title: "In Review", color: 'text-amber-500', bg: 'bg-amber-50', icon: Clock };
      case 'In Approval': return { title: "In Approval", color: 'text-blue-500', bg: 'bg-blue-50', icon: Zap };
      case 'Resolved': return { title: "Resolved", color: 'text-emerald-500', bg: 'bg-emerald-50', icon: CheckCircle2 };
      default: return { title: s, color: 'text-slate-400', bg: 'bg-slate-100', icon: FileText };
    }
  };

  const config = getColumnConfig(status);

  return (
    <div className="w-80 flex-shrink-0 flex flex-col h-full group/column">
      <div className="flex items-center justify-between mb-4 px-3">
        <div className="flex items-center gap-2.5">
           <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center border-2 border-white shadow-sm", config.bg)}>
              <config.icon className={cn("h-4 w-4", config.color)} />
           </div>
           <h2 className="font-display font-bold text-slate-900 tracking-tight">{config.title}</h2>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] font-bold bg-white border-slate-200 text-slate-400 px-2 h-5 flex items-center justify-center min-w-[24px]">
          {plansInColumn.length}
        </Badge>
      </div>

      <div className="flex-1 min-h-[500px] bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200/60 p-3 group-hover/column:bg-slate-50/80 group-hover/column:border-slate-300 transition-all duration-300">
        <SortableContext id={status} items={plansInColumn.map(ap => ap.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {plansInColumn.map(ap => {
              const deficiency = deficiencies.find(d => d.id === ap.deficiencyId);
              if (!deficiency) return null;
              return (
                <div key={ap.id} className="relative group">
                  <div className={cn(
                    "transition-all duration-300",
                    isSelectionMode ? "pl-10" : ""
                  )}>
                    {isSelectionMode && (
                      <div className="absolute top-4 left-3 z-20">
                        <Checkbox 
                          checked={selectedIds.includes(deficiency.id)} 
                          onCheckedChange={() => onToggleSelect(deficiency.id)}
                          className="h-5 w-5 rounded-md data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                        />
                      </div>
                    )}
                    <DeficiencyCard deficiency={deficiency} actionPlan={ap} />
                  </div>

                  <div className="flex flex-col gap-2 mt-2 px-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-[-5px] group-hover:translate-y-0">
                    <div className="flex gap-2">
                    {(status === "Ineffective" || role === 'Admin') && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 h-8 text-[10px] font-bold uppercase tracking-widest bg-white border-slate-200 rounded-xl"
                        onClick={() => onEditPlan(ap)}
                      >
                        Edit Plan
                      </Button>
                    )}
                    {status === "Ineffective" && ['Line 1', 'Admin'].includes(role) && (
                      <Button 
                        size="sm" 
                        className="flex-1 h-8 text-[10px] font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                        onClick={() => onStatusChange(ap.id, "Submit")}
                      >
                        <Send className="h-3 w-3 mr-1" /> {t('workflow:submitPlan', { ns: 'workflow' })}
                      </Button>
                    )}
                    </div>

                    {status === "In Review" && ['Line 2', 'Admin'].includes(role) && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 h-8 text-[10px] font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                          onClick={() => onStatusChange(ap.id, "Review")}
                        >
                          <Zap className="h-3 w-3 mr-1" /> Pass Review
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 h-8 text-[10px] font-bold uppercase tracking-widest text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl"
                          onClick={() => onStatusChange(ap.id, "Reject")}
                        >
                          <XCircle className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    )}

                    {status === "In Approval" && ['Admin'].includes(role) && (
                       <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 h-8 text-[10px] font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                          onClick={() => onStatusChange(ap.id, "Approve")}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 h-8 text-[10px] font-bold uppercase tracking-widest text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl"
                          onClick={() => onStatusChange(ap.id, "Reject")}
                        >
                          <XCircle className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>

                  {!isSelectionMode && (
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="absolute top-3 right-10 h-7 w-7 rounded-full shadow-md bg-white opacity-0 group-hover:opacity-100 transition-all hover:text-indigo-600 hover:scale-110"
                      title="Assess Severity (DoD)"
                      onClick={() => onAssess(deficiency.id)}
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export function DeficiencyBoard() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('deficiency');
  const [isWizardOpen, setWizardOpen] = React.useState(false);
  const [isRemediationOpen, setRemediationOpen] = React.useState(false);
  const [isAggregateMode, setAggregateMode] = React.useState(false);
  const [selectedDeficiencies, setSelectedDeficiencies] = React.useState<string[]>([]);
  const [activeDeficiencyId, setActiveDeficiencyId] = React.useState<string | null>(null);
  const [activePlan, setActivePlan] = React.useState<ActionPlan | null>(null);

  const { data: deficienciesData, isLoading: deficienciesLoading } = useQuery({
    queryKey: ['deficiencies'],
    queryFn: () => api<{ items: Deficiency[] }>('/api/deficiencies'),
  });

  const { data: actionPlansData, isLoading: actionPlansLoading } = useQuery({
    queryKey: ['actionplans'],
    queryFn: () => api<{ items: ActionPlan[] }>('/api/actionplans'),
  });

  const { data: simulationsData } = useQuery({
    queryKey: ['simulations'],
    queryFn: () => api<{ items: MaterialitySimulation[] }>('/api/simulations'),
  });

  const activeSimulation = simulationsData?.items.find(s => s.status === 'Approved') || 
                           simulationsData?.items[0]; // Fallback
  const pmValue = activeSimulation?.pmValue;

  const [actionPlans, setActionPlans] = React.useState<ActionPlan[]>([]);

  React.useEffect(() => {
    if (actionPlansData?.items) {
      setActionPlans(actionPlansData.items);
    }
  }, [actionPlansData]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const planMutation = useMutation({
    mutationFn: async (payload: Partial<ActionPlan> & { id: string; deficiencyId: string }) => {
      await api(`/api/actionplans/${payload.id}`, { 
        method: 'PUT', 
        body: JSON.stringify(payload) 
      });
    },
    onSuccess: () => {
      toast.success("Action plan updated.");
      queryClient.invalidateQueries({ queryKey: ['actionplans'] });
      queryClient.invalidateQueries({ queryKey: ['deficiencies'] });
      setRemediationOpen(false);
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
      queryClient.invalidateQueries({ queryKey: ['actionplans'] });
    },
  });

  const severityMutation = useMutation({
    mutationFn: (payload: { 
      id: string; 
      severity: DeficiencySeverity; 
      rationale?: string; 
      exposureValue?: number;
      assertions?: string[];
      flowchartPath?: Record<number, boolean>;
    }) => 
      api(`/api/deficiencies/${payload.id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success("Deficiency severity updated based on DoD assessment.");
      queryClient.invalidateQueries({ queryKey: ['deficiencies'] });
    },
  });

  const aggregateMutation = useMutation({
    mutationFn: (data: Partial<AggregateDeficiency>) => 
      api(`/api/aggregatedeficiencies`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Aggregate deficiency analysis saved (Lampiran 10).");
      queryClient.invalidateQueries({ queryKey: ['aggregatedeficiencies'] });
      setAggregateMode(false);
      setSelectedDeficiencies([]);
    },
  });

  const workflowMutation = useMutation({
    mutationFn: async ({ id, action, note }: { id: string, action: string, note: string }) => {
      return await api(`/api/actionplans/${id}/workflow`, {
        method: 'POST',
        body: JSON.stringify({ action, note })
      });
    },
    onSuccess: () => {
      toast.success("Workflow status updated.");
      queryClient.invalidateQueries({ queryKey: ['actionplans'] });
      queryClient.invalidateQueries({ queryKey: ['deficiencies'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const handleAssess = (id: string) => {
    setActiveDeficiencyId(id);
    setWizardOpen(true);
  };

  const handleWizardComplete = (severity: DeficiencySeverity, rationale?: string, metadata?: any) => {
    if (isAggregateMode) {
      const selectedData = deficienciesData?.items.filter(d => selectedDeficiencies.includes(d.id)) || [];
      aggregateMutation.mutate({
        deficiencyIds: selectedDeficiencies,
        finalSeverity: severity,
        conclusionRationale: rationale || "Evaluasi agregasi akun sejenis (Box 7 loop-back).",
        combinedMagnitude: metadata?.exposureValue || selectedData.reduce((sum, d) => sum + (d.magnitude || 0), 0),
        affectedAccounts: [...new Set(selectedData.map(d => d.controlId))], 
        affectedAssertions: metadata?.assertions,
      });
    } else if (activeDeficiencyId) {
      severityMutation.mutate({ 
        id: activeDeficiencyId, 
        severity, 
        rationale, 
        ...metadata 
      });
    }
  };

  const handleRoleChange = (role: string) => {
    localStorage.setItem('mockRole', role);
    window.location.reload();
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const plan = actionPlans.find(p => p.id === active.id);
      const activeContainer = plan?.status;
      const overContainerId = over.data.current?.sortable?.containerId || over.id;
      const overContainer = KANBAN_COLUMNS.includes(overContainerId as any) ? overContainerId as ActionPlanStatus : null;

      if (plan && activeContainer && overContainer && activeContainer !== overContainer) {
        setActionPlans(previousPlans => {
          const activeIndex = previousPlans.findIndex(ap => ap.id === active.id);
          if (activeIndex === -1) return previousPlans;

          const newPlans = [...previousPlans];
          newPlans[activeIndex] = { ...newPlans[activeIndex], status: overContainer };
          return newPlans;
        });

        planMutation.mutate({ 
          id: active.id as string, 
          status: overContainer, 
          deficiencyId: plan.deficiencyId 
        });
      }
    }
  }, [actionPlans, planMutation]);

  const isLoading = deficienciesLoading || actionPlansLoading;
  const mockRole = localStorage.getItem('mockRole') || 'Line 1';

  const handleToggleSelect = (id: string) => {
    setSelectedDeficiencies(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleStartAggregate = () => {
    if (selectedDeficiencies.length < 2) {
      toast.error("Pilih minimal 2 temuan untuk analisis agregasi.");
      return;
    }
    setWizardOpen(true);
  };

  return (
    <AppLayout container>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex flex-col h-full space-y-8 pb-10"
      >
        <motion.div variants={itemVariants}>
          <PageHeader 
            title={<span className="font-display tracking-tight">Deficiency Board</span>} 
            description="Track remediation and assess severity using the Degree of Deficiency (DoD) model."
            badge={isAggregateMode && (
               <Badge className="bg-rose-500 text-white border-none shadow-lg animate-pulse px-3 py-1 font-bold text-[10px] uppercase tracking-widest">
                  Selection Mode Active
               </Badge>
            )}
          >
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                {['Line 1', 'Line 2', 'Admin'].map(r => (
                  <Button 
                    key={r}
                    variant={mockRole === r ? "default" : "ghost"} 
                    size="sm" 
                    className={cn(
                      "h-8 text-[10px] font-bold uppercase tracking-widest px-3 rounded-lg transition-all",
                      mockRole === r ? "bg-white text-indigo-600 shadow-sm border border-slate-200 hover:bg-white" : "text-slate-400"
                    )}
                    onClick={() => handleRoleChange(r)}
                  >
                    {r}
                  </Button>
                ))}
              </div>

              <div className="h-8 w-px bg-slate-200 mx-1" />

              {!isAggregateMode ? (
                <Button 
                  variant="outline" 
                  onClick={() => setAggregateMode(true)} 
                  className="h-10 gap-2 border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-[10px] uppercase tracking-widest px-5 rounded-xl shadow-sm"
                >
                  <Layers className="h-4 w-4 text-indigo-500" /> Aggregate Analysis
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => { setAggregateMode(false); setSelectedDeficiencies([]); }}
                    className="h-10 font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleStartAggregate} 
                    className="h-10 gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all font-bold text-[10px] uppercase tracking-widest px-5 rounded-xl text-white"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Evaluate Group ({selectedDeficiencies.length})
                  </Button>
                </div>
              )}
            </div>
          </PageHeader>
        </motion.div>

        <div className="flex-1 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-200">
          {isLoading ? (
            <div className="flex gap-6">
              {KANBAN_COLUMNS.map(status => (
                <div key={status} className="w-80 flex-shrink-0 space-y-4">
                  <Skeleton className="h-10 w-3/4 rounded-xl" />
                  <Skeleton className="h-32 w-full rounded-2xl" />
                  <Skeleton className="h-32 w-full rounded-2xl" />
                </div>
              ))}
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="flex gap-8 pb-4 h-full min-h-[600px]">
                {KANBAN_COLUMNS.map(status => (
                  <KanbanColumn
                    key={status}
                    status={status}
                    deficiencies={deficienciesData?.items || []}
                    actionPlans={actionPlans}
                    onAssess={handleAssess}
                    isSelectionMode={isAggregateMode}
                    selectedIds={selectedDeficiencies}
                    onToggleSelect={handleToggleSelect}
                    role={mockRole}
                    onEditPlan={(plan) => {
                      setActivePlan(plan);
                      setRemediationOpen(true);
                    }}
                    onStatusChange={(apId, action) => {
                      workflowMutation.mutate({
                        id: apId,
                        action,
                        note: `Transitioned from board: ${action}`
                      });
                    }}
                  />
                ))}
              </div>
            </DndContext>
          )}
        </div>
      </motion.div>

      <DoDWizard 
        isOpen={isWizardOpen} 
        setIsOpen={setWizardOpen} 
        onComplete={handleWizardComplete} 
        isAggregate={isAggregateMode}
        performanceMateriality={pmValue}
      />

      <RemediationForm
        isOpen={isRemediationOpen}
        setIsOpen={setRemediationOpen}
        actionPlan={activePlan || undefined}
        onSubmit={(updatedPlan) => planMutation.mutate(updatedPlan)}
        isLoading={planMutation.isPending}
      />
    </AppLayout>
  );
}