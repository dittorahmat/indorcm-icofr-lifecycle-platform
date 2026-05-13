import React, { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import type { Deficiency, ActionPlan, ActionPlanStatus, DeficiencySeverity, AggregateDeficiency, MaterialitySimulation } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { DeficiencyCard } from '@/components/deficiencies/DeficiencyCard';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldAlert, Layers, Plus, CheckCircle2 } from 'lucide-react';
import { DoDWizard } from '@/components/deficiencies/DoDWizard';
import { RemediationForm } from '@/components/deficiencies/RemediationForm';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { isBeforeYearEnd } from '@/lib/compliance-utils';

import { useTranslation } from 'react-i18next';

const KANBAN_COLUMNS: ActionPlanStatus[] = ["Draft", "In Review", "In Progress", "Resolved", "Verified"];

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
  status: ActionPlanStatus; 
  deficiencies: Deficiency[]; 
  actionPlans: ActionPlan[], 
  onAssess: (dId: string) => void,
  onEditPlan: (plan: ActionPlan) => void,
  isSelectionMode: boolean,
  selectedIds: string[],
  onToggleSelect: (id: string) => void,
  role: string,
  onStatusChange: (apId: string, newStatus: ActionPlanStatus) => void
}) {
  const { t } = useTranslation('deficiency');
  const plansInColumn = actionPlans.filter(ap => ap.status === status);

  const getColumnTitle = (s: ActionPlanStatus) => {
    switch (s) {
      case 'Draft': return t('status.draft');
      case 'In Review': return t('status.review');
      case 'In Progress': return t('status.progress');
      case 'Resolved': return t('status.resolved');
      case 'Verified': return t('status.verified');
      default: return s;
    }
  };

  return (
    <div className="w-72 md:w-80 flex-shrink-0">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="font-semibold text-lg">{getColumnTitle(status)}</h2>
        <span className="text-sm font-medium bg-muted text-muted-foreground rounded-full px-2 py-0.5">{plansInColumn.length}</span>
      </div>
      <SortableContext id={status} items={plansInColumn.map(ap => ap.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4 h-full min-h-[200px] bg-muted/50 rounded-lg p-2">
          {plansInColumn.map(ap => {
            const deficiency = deficiencies.find(d => d.id === ap.deficiencyId);
            if (!deficiency) return null;
            return (
              <div key={ap.id} className="relative group">
                {isSelectionMode && (
                  <div className="absolute top-2 left-2 z-20">
                    <Checkbox 
                      checked={selectedIds.includes(deficiency.id)} 
                      onCheckedChange={() => onToggleSelect(deficiency.id)}
                    />
                  </div>
                )}
                <div className={isSelectionMode ? "ml-6" : ""}>
                  <DeficiencyCard deficiency={deficiency} actionPlan={ap} />
                </div>
                
                <div className="flex gap-2 mt-2 px-1">
                  {(status === "Draft" || role === 'Admin') && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 h-7 text-xs"
                      onClick={() => onEditPlan(ap)}
                    >
                      Edit Plan
                    </Button>
                  )}
                  {status === "Draft" && ['Line 1', 'Admin'].includes(role) && (
                    <Button 
                      size="sm" 
                      variant="default" 
                      className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700"
                      onClick={() => onStatusChange(ap.id, "In Review")}
                    >
                      Submit for Review
                    </Button>
                  )}
                  {status === "In Review" && ['Line 2', 'Admin'].includes(role) && (
                    <>
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700"
                        onClick={() => onStatusChange(ap.id, "In Progress")}
                      >
                        Approve Plan
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => onStatusChange(ap.id, "Draft")}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>

                {!isSelectionMode && (
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="absolute top-2 right-10 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Assess Severity (DoD)"
                    onClick={() => onAssess(deficiency.id)}
                  >
                    <ShieldAlert className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </SortableContext>
    </div>
  );
}

export function DeficiencyBoard() {
  const queryClient = useQueryClient();
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
      // The backend handles status synchronization, actualCompletionDate, 
      // and isBeforeYearEnd logic. We just send the intended update.
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
        affectedAccounts: [...new Set(selectedData.map(d => d.controlId))], // Simplified mapping
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

  const findContainer = useCallback((id: string) => {
    return actionPlans.find(ap => ap.id === id)?.status;
  }, [actionPlans]);

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

  // DEMO MODE: Removed access restriction - All lines can access
  // if (!['Line 2', 'Line 3', 'Admin'].includes(mockRole)) {
  //   return (
  //     <AppLayout container>
  //       <div className="flex items-center justify-center h-[calc(100vh-200px)]">
  //         <Card className="max-w-md">
  //           <CardContent className="p-8 text-center flex flex-col items-center gap-4">
  //             <AlertTriangle className="h-12 w-12 text-destructive" />
  //             <h2 className="text-2xl font-bold">Access Denied</h2>
  //             <p className="text-muted-foreground">The Deficiency Board is restricted to Line 2, Line 3, and Admin roles.</p>
  //           </CardContent>
  //         </Card>
  //       </div>
  //     </AppLayout>
  //   );
  // }

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
    toast.info(`Menganalisis dampak gabungan dari ${selectedDeficiencies.length} temuan...`, {
      description: "Sesuai Lampiran 10 - Penentuan DoD secara Agregasi."
    });
    // For demo purposes, we trigger the wizard for the aggregate group
    setWizardOpen(true);
  };

  return (
    <AppLayout container>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">Deficiency Board</h1>
            <p className="text-muted-foreground">Track remediation and assess severity using the Degree of Deficiency (DoD) model.</p>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-muted p-1 rounded-md mr-4">
              {['Line 1', 'Line 2', 'Admin'].map(r => (
                <Button 
                  key={r}
                  variant={mockRole === r ? "default" : "ghost"} 
                  size="sm" 
                  className="h-7 text-xs px-2"
                  onClick={() => handleRoleChange(r)}
                >
                  {r}
                </Button>
              ))}
            </div>
            {!isAggregateMode ? (
              <Button variant="outline" size="sm" onClick={() => setAggregateMode(true)} className="gap-2">
                <Layers className="h-4 w-4" /> Aggregate Analysis (Lampiran 10)
              </Button>
            ) : (
              <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                <Button variant="ghost" size="sm" onClick={() => { setAggregateMode(false); setSelectedDeficiencies([]); }}>
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleStartAggregate} className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <CheckCircle2 className="h-4 w-4" /> Evaluate Aggr. Group ({selectedDeficiencies.length})
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-x-auto pb-4">
          {isLoading ? (
            <div className="flex gap-6">
              {KANBAN_COLUMNS.map(status => (
                <div key={status} className="w-80 flex-shrink-0">
                  <Skeleton className="h-8 w-3/4 mb-4" />
                  <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
                </div>
              ))}
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <motion.div className="flex gap-6 pb-4" layout>
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
                    onStatusChange={(apId, newStatus) => {
                      const plan = actionPlans.find(p => p.id === apId);
                      if (plan) {
                        planMutation.mutate({ 
                          id: apId, 
                          status: newStatus, 
                          deficiencyId: plan.deficiencyId 
                        });
                      }
                    }}
                  />
                ))}
              </motion.div>
            </DndContext>
          )}
        </div>
      </div>

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