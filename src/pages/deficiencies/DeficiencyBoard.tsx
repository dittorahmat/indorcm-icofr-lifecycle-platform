import React, { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, pointerWithin, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import type { Deficiency, ActionPlan, ActionPlanStatus, DeficiencySeverity, AggregateDeficiency, MaterialitySimulation, DeficiencyWorkflowStatus } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { DeficiencyCard } from '@/components/deficiencies/DeficiencyCard';
import { toast } from 'sonner';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  AlertTriangle, ShieldAlert, Layers, Plus, CheckCircle2, 
  Search, Kanban, Filter, UserCheck, ChevronRight, Settings2,
  Clock, AlertCircle, FileText, Zap, ShieldCheck, Send, XCircle
} from 'lucide-react';
import { DoDWorksheetDialog } from '@/components/deficiencies/DoDWorksheetDialog';
import { RemediationForm } from '@/components/deficiencies/RemediationForm';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const KANBAN_COLUMNS: string[] = ["Ineffective", "In Review", "In Approval", "Resolved"];

/**
 * Granular origin filters across the Three Lines Model (SK-5/DKU.MBU/11/2024).
 * `fallback` mirrors the `en` locale, which is the app's `fallbackLng`.
 */
const SOURCE_FILTERS = [
  { id: 'all', labelKey: 'sources.all', fallback: 'All' },
  { id: 'csa', labelKey: 'sources.csa', fallback: 'CSA Ineffective' },
  { id: 'tod', labelKey: 'sources.tod', fallback: 'TOD Review (Design)' },
  { id: 'toe', labelKey: 'sources.toe', fallback: 'TOE Review (Operation)' },
  { id: 'audit', labelKey: 'sources.audit', fallback: 'External / SPI Audit' },
] as const;

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
  onStatusChange,
  fullWidth,
  alwaysShowActions
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
  onStatusChange: (apId: string, action: string) => void,
  fullWidth?: boolean,
  alwaysShowActions?: boolean
}) {
  const { t } = useTranslation('deficiency');
  const plansInColumn = actionPlans.filter(ap => (ap.workflowStatus || ap.status) === status);

  const getColumnConfig = (s: string) => {
    switch (s) {
      case 'Ineffective': return { title: t('board.columns.ineffective', 'Ineffective'), color: 'text-slate-400', bg: 'bg-slate-100', icon: FileText };
      case 'In Review': return { title: t('board.columns.review', 'In Review'), color: 'text-amber-500', bg: 'bg-amber-50', icon: Clock };
      case 'In Approval': return { title: t('board.columns.approval', 'In Approval'), color: 'text-blue-500', bg: 'bg-blue-50', icon: Zap };
      case 'Resolved': return { title: t('board.columns.resolved', 'Resolved'), color: 'text-emerald-500', bg: 'bg-emerald-50', icon: CheckCircle2 };
      default: return { title: s, color: 'text-slate-400', bg: 'bg-slate-100', icon: FileText };
    }
  };

  const config = getColumnConfig(status);
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className={cn(
      "flex flex-col h-full group/column",
      fullWidth ? "w-full" : "w-80 flex-shrink-0"
    )}>
      <div className="flex items-center justify-between mb-4 px-3">
        <div className="flex items-center gap-2.5">
           <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center border-2 border-white shadow-sm", config.bg)}>
              <config.icon className={cn("h-4 w-4", config.color)} />
           </div>
           <h2 className="font-display font-bold text-slate-900 tracking-tight">{config.title}</h2>
        </div>
        <Badge variant="outline" className="font-mono text-xs font-bold bg-white border-slate-200 text-slate-400 px-2 h-5 flex items-center justify-center min-w-[24px]">
          {plansInColumn.length}
        </Badge>
      </div>

      <div 
        ref={setNodeRef}
        data-droppable-id={status}
        className={cn(
          "flex-1 rounded-lg border-2 border-dashed p-3 transition-all duration-300",
          isOver 
            ? "bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-300/40" 
            : "bg-slate-50/50 border-slate-200/60 group-hover/column:bg-slate-50/80 group-hover/column:border-slate-300",
          fullWidth ? "min-h-[200px]" : "min-h-[500px]"
        )}
      >
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

                  <div className={cn(
                    "flex flex-col gap-2 mt-2 px-1 transition-all duration-300",
                    alwaysShowActions
                      ? "opacity-100 [&_button]:min-h-[44px]"
                      : "opacity-0 group-hover:opacity-100 transform translate-y-[-5px] group-hover:translate-y-0"
                  )}>
                    <div className="flex gap-2">
                    {(status === "Ineffective" || role === 'Admin') && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 h-8 text-xs font-bold uppercase tracking-widest bg-white border-slate-200 rounded-lg"
                        onClick={() => onEditPlan(ap)}
                      >
                        {t('actions.actionPlan', 'Action Plan')}
                      </Button>
                    )}
                    {status === "Ineffective" && ['Line 1', 'Admin'].includes(role) && (
                      <Button 
                        size="sm" 
                        className="flex-1 h-8 text-xs font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
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
                          className="flex-1 h-8 text-xs font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                          onClick={() => onStatusChange(ap.id, "Review")}
                        >
                          <Zap className="h-3 w-3 mr-1" /> {t('board.actions.passReview', 'Pass Review')}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 h-8 text-xs font-bold uppercase tracking-widest text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg"
                          onClick={() => onStatusChange(ap.id, "Reject")}
                        >
                          <XCircle className="h-3 w-3 mr-1" /> {t('board.actions.reject', 'Reject')}
                        </Button>
                      </div>
                    )}

                    {status === "In Approval" && ['Admin'].includes(role) && (
                       <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 h-8 text-xs font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                          onClick={() => onStatusChange(ap.id, "Approve")}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" /> {t('board.actions.approve', 'Approve')}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 h-8 text-xs font-bold uppercase tracking-widest text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg"
                          onClick={() => onStatusChange(ap.id, "Reject")}
                        >
                          <XCircle className="h-3 w-3 mr-1" /> {t('board.actions.reject', 'Reject')}
                        </Button>
                      </div>
                    )}
                  </div>

                  {!isSelectionMode && (
                    <Button 
                      size="icon" 
                      variant="secondary" 
                        className={cn(
                          "absolute top-3 right-10 rounded-lg shadow-md bg-white transition-all hover:text-indigo-600 hover:scale-110",
                          alwaysShowActions ? "h-11 w-11 opacity-100" : "h-7 w-7 opacity-0 group-hover:opacity-100"
                        )}
                        title={t('board.assessSeverity', 'Assess Severity (DoD)')}
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
  const { user } = useAuth();
  const mockRole = localStorage.getItem('mockRole');
  const userRole = user?.role || mockRole || 'Admin';

  const { t } = useTranslation(['deficiency', 'workflow', 'common']);
  const [isWizardOpen, setWizardOpen] = React.useState(false);
  const [isRemediationOpen, setRemediationOpen] = React.useState(false);
  const [isAggregateMode, setAggregateMode] = React.useState(false);
  const [selectedDeficiencies, setSelectedDeficiencies] = React.useState<string[]>([]);
  const [activeDeficiencyId, setActiveDeficiencyId] = React.useState<string | null>(null);
  const [activePlan, setActivePlan] = React.useState<ActionPlan | null>(null);
  const [sourceFilter, setSourceFilter] = React.useState<string>("all");
  const [mobileStatus, setMobileStatus] = React.useState<string>(KANBAN_COLUMNS[0]);

  const mobileStatusKey: Record<string, string> = {
    "Ineffective": "status.ineffective",
    "In Review": "status.review",
    "In Approval": "status.approval",
    "Resolved": "status.resolved"
  };

  const { data: deficienciesData, isLoading: deficienciesLoading } = useQuery({
    queryKey: ['deficiencies'],
    queryFn: () => api<{ items: Deficiency[] }>('/api/deficiencies'),
  });

  const filteredDeficiencies = React.useMemo(() => {
    if (!deficienciesData?.items) return [];
    if (sourceFilter === "all") return deficienciesData.items;
    if (sourceFilter === "csa") return deficienciesData.items.filter(d => d.source === "Lini 1 - CSA");
    if (sourceFilter === "tod") return deficienciesData.items.filter(d => d.source === "Lini 2 - TOD Review");
    if (sourceFilter === "toe") return deficienciesData.items.filter(d => d.source === "Lini 2 - CSA Validation" || d.source === "Lini 2 - CSA Review" || d.source === "Lini 2 - TOE Review");
    if (sourceFilter === "audit") return deficienciesData.items.filter(d => d.source === "Lini 3 - Audit");
    return deficienciesData.items;
  }, [deficienciesData, sourceFilter]);

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
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
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
      if (!plan) return;

      const currentWorkflowStatus = (plan.workflowStatus || plan.status || "Ineffective") as DeficiencyWorkflowStatus;
      
      // Determine target column: overContainerId could be a column status string or another card ID
      let overStatus: DeficiencyWorkflowStatus | null = null;
      const overIdStr = String(over.id);
      if (KANBAN_COLUMNS.includes(overIdStr)) {
        overStatus = overIdStr as DeficiencyWorkflowStatus;
      } else {
        const overCard = actionPlans.find(p => p.id === over.id);
        if (overCard) {
          overStatus = (overCard.workflowStatus || overCard.status || "Ineffective") as DeficiencyWorkflowStatus;
        } else if (over.data.current?.sortable?.containerId && KANBAN_COLUMNS.includes(over.data.current.sortable.containerId)) {
          overStatus = over.data.current.sortable.containerId as DeficiencyWorkflowStatus;
        }
      }

      if (!overStatus || currentWorkflowStatus === overStatus) {
        return;
      }

      // SK-5 Transition mapping:
      // Ineffective -> In Review : Submit (Line 1, Admin)
      // In Review -> In Approval : Review (Line 2, Admin)
      // In Approval -> Resolved  : Approve (Admin)
      // Any -> Ineffective       : Reject / Rollback
      let action: string | null = null;
      let note = `Transitioned via Kanban board drag-and-drop to ${overStatus}`;

      if (currentWorkflowStatus === 'Ineffective' && overStatus === 'In Review') {
        if (!['Line 1', 'Admin'].includes(userRole)) {
          toast.error("Hanya Lini 1 atau Admin yang dapat mengajukan rencana aksi (Submit).");
          return;
        }
        action = "Submit";
      } else if (currentWorkflowStatus === 'In Review' && overStatus === 'In Approval') {
        if (!['Line 2', 'Admin'].includes(userRole)) {
          toast.error("Hanya Lini 2 atau Admin yang dapat meloloskan telaah (Pass Review).");
          return;
        }
        action = "Review";
      } else if (currentWorkflowStatus === 'In Approval' && overStatus === 'Resolved') {
        if (!['Admin'].includes(userRole)) {
          toast.error("Hanya Admin yang dapat menyetujui penyelesaian (Approve).");
          return;
        }
        action = "Approve";
      } else if (overStatus === 'Ineffective') {
        action = currentWorkflowStatus === 'Resolved' ? 'Rollback' : 'Reject';
        note = `Dikembalikan ke status Ineffective via Kanban board`;
      } else {
        // Direct transition when authorized as Admin
        if (userRole === 'Admin') {
          if (overStatus === 'Resolved') action = 'Approve';
          else if (overStatus === 'In Approval') action = 'Review';
          else if (overStatus === 'In Review') action = 'Submit';
        } else {
          toast.error(`Perpindahan status dari "${currentWorkflowStatus}" ke "${overStatus}" tidak diizinkan tanpa tahapan tata kelola SK-5.`);
          return;
        }
      }

      if (action) {
        // Optimistic UI update
        setActionPlans(previousPlans => {
          const activeIndex = previousPlans.findIndex(ap => ap.id === active.id);
          if (activeIndex === -1) return previousPlans;
          const newPlans = [...previousPlans];
          newPlans[activeIndex] = {
            ...newPlans[activeIndex],
            workflowStatus: overStatus as DeficiencyWorkflowStatus,
            status: overStatus === 'Resolved' ? 'Resolved' : newPlans[activeIndex].status
          };
          return newPlans;
        });

        workflowMutation.mutate({
          id: plan.id,
          action,
          note
        });
      }
    }
  }, [actionPlans, userRole, workflowMutation]);

  const isLoading = deficienciesLoading || actionPlansLoading;

  const handleToggleSelect = (id: string) => {
    setSelectedDeficiencies(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleStartAggregate = () => {
    if (selectedDeficiencies.length < 2) {
      toast.error(t('board.minSelectionError', 'Select at least 2 findings for aggregate analysis.'));
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
            title={<span className="font-display tracking-tight">{t('title', 'Deficiency Board')}</span>}
            description={t('description', 'Track remediation and assess severity using the Degree of Deficiency (DoD) model.')}
            badge={isAggregateMode && (
               <Badge className="bg-rose-500 text-white border-none shadow-sm px-3 py-1 font-bold text-xs uppercase tracking-wider">
                  {t('board.selectionModeActive', 'Selection Mode Active')}
               </Badge>
            )}
          >
            <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">{t('sources.label', 'Finding Source')}</span>
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner">
                  {SOURCE_FILTERS.map(s => (
                    <Button 
                      key={s.id}
                      variant={sourceFilter === s.id ? "default" : "ghost"} 
                      size="sm" 
                      aria-pressed={sourceFilter === s.id}
                      className={cn(
                        "h-8 text-xs font-bold uppercase tracking-widest px-3 rounded-lg transition-all",
                        sourceFilter === s.id ? "bg-white text-indigo-600 shadow-sm border border-slate-200 hover:bg-white" : "text-slate-400"
                      )}
                      onClick={() => setSourceFilter(s.id)}
                    >
                      {t(s.labelKey, s.fallback)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block" />

              {!isAggregateMode ? (
                <Button 
                  variant="outline" 
                  onClick={() => setAggregateMode(true)} 
                  className="h-10 gap-2 border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-widest px-5 rounded-lg shadow-sm self-end"
                >
                  <Layers className="h-4 w-4 text-indigo-500" /> {t('board.aggregateAnalysis', 'Aggregate Analysis')}
                </Button>
              ) : (
                <div className="flex gap-2 self-end">
                  <Button 
                    variant="ghost" 
                    onClick={() => { setAggregateMode(false); setSelectedDeficiencies([]); }}
                    className="h-10 font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600"
                  >
                    {t('board.cancel', 'Cancel')}
                  </Button>
                  <Button 
                    onClick={handleStartAggregate} 
                    className="h-10 gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all font-bold text-xs uppercase tracking-widest px-5 rounded-lg text-white"
                  >
                    <CheckCircle2 className="h-4 w-4" /> {t('board.evaluateGroup', { defaultValue: 'Evaluate Group ({{count}})', count: selectedDeficiencies.length })}
                  </Button>
                </div>
              )}
            </div>
          </PageHeader>
        </motion.div>

        <DndContext
          sensors={sensors}
          collisionDetection={(args) => {
            const pointerCollisions = pointerWithin(args);
            if (pointerCollisions.length > 0) return pointerCollisions;
            return closestCorners(args);
          }}
          onDragEnd={handleDragEnd}
        >
          {/* DESKTOP VIEW: Kanban columns */}
          <div className="hidden md:block flex-1 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-200" data-testid="deficiency-kanban-desktop">
          {isLoading ? (
            <div className="flex gap-6">
              {KANBAN_COLUMNS.map(status => (
                <div key={status} className="w-80 flex-shrink-0 space-y-4">
                   <Skeleton className="h-10 w-3/4 rounded-lg" />
                   <Skeleton className="h-32 w-full rounded-lg" />
                   <Skeleton className="h-32 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
              <div className="flex gap-8 pb-4 h-full min-h-[600px]">
                {KANBAN_COLUMNS.map(status => (
                  <KanbanColumn
                    key={status}
                    status={status}
                    deficiencies={filteredDeficiencies}
                    actionPlans={actionPlans}
                    onAssess={handleAssess}
                    isSelectionMode={isAggregateMode}
                    selectedIds={selectedDeficiencies}
                    onToggleSelect={handleToggleSelect}
                    role={userRole}
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
          )}
          </div>

          {/* MOBILE VIEW: Status tabs + vertical card stream */}
          <div className="md:hidden flex-1" data-testid="deficiency-mobile-tabs">
          {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-11 w-full rounded-lg" />
                <Skeleton className="h-28 w-full rounded-lg" />
                <Skeleton className="h-28 w-full rounded-lg" />
              </div>
          ) : (
              <>
                <div className="flex gap-1.5 overflow-x-auto pb-3" role="tablist" aria-label={t('board.statusFilter', { defaultValue: 'Deficiency status' })}>
                  {KANBAN_COLUMNS.map(status => {
                    const count = actionPlans.filter(ap => (ap.workflowStatus || ap.status) === status).length;
                    const isActive = mobileStatus === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setMobileStatus(status)}
                        className={cn(
                          "flex-1 min-h-[44px] min-w-[100px] rounded-lg border px-3 text-xs font-bold uppercase tracking-wider transition-colors",
                          isActive
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-500 border-slate-200"
                        )}
                      >
                        {t(mobileStatusKey[status], { defaultValue: status })} ({count})
                      </button>
                    );
                  })}
                </div>
                <KanbanColumn
                  key={mobileStatus}
                  status={mobileStatus}
                  deficiencies={filteredDeficiencies}
                  actionPlans={actionPlans}
                  onAssess={handleAssess}
                  isSelectionMode={isAggregateMode}
                  selectedIds={selectedDeficiencies}
                  onToggleSelect={handleToggleSelect}
                  role={userRole}
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
                  fullWidth
                  alwaysShowActions
                />
              </>
          )}
          </div>
        </DndContext>
      </motion.div>

      <DoDWorksheetDialog 
        isOpen={isWizardOpen} 
        setIsOpen={setWizardOpen} 
        deficiency={deficienciesData?.items.find(d => d.id === activeDeficiencyId) || null}
        onComplete={handleWizardComplete} 
        isAggregate={isAggregateMode}
        performanceMateriality={pmValue || undefined}
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