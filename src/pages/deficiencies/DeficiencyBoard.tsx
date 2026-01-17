import React, { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import type { Deficiency, ActionPlan, ActionPlanStatus, DeficiencySeverity } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { DeficiencyCard } from '@/components/deficiencies/DeficiencyCard';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldAlert, Layers, Plus, CheckCircle2 } from 'lucide-react';
import { DoDWizard } from '@/components/deficiencies/DoDWizard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const KANBAN_COLUMNS: ActionPlanStatus[] = ["Draft", "In Progress", "Resolved", "Verified"];

function KanbanColumn({ 
  status, 
  deficiencies, 
  actionPlans, 
  onAssess,
  isSelectionMode,
  selectedIds,
  onToggleSelect 
}: { 
  status: ActionPlanStatus; 
  deficiencies: Deficiency[]; 
  actionPlans: ActionPlan[], 
  onAssess: (dId: string) => void,
  isSelectionMode: boolean,
  selectedIds: string[],
  onToggleSelect: (id: string) => void
}) {
  const plansInColumn = actionPlans.filter(ap => ap.status === status);

  return (
    <div className="w-72 md:w-80 flex-shrink-0">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="font-semibold text-lg">{status}</h2>
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
  const [isAggregateMode, setAggregateMode] = React.useState(false);
  const [selectedDeficiencies, setSelectedDeficiencies] = React.useState<string[]>([]);
  const [activeDeficiencyId, setActiveDeficiencyId] = React.useState<string | null>(null);

  const { data: deficienciesData, isLoading: deficienciesLoading } = useQuery({
    queryKey: ['deficiencies'],
    queryFn: () => api<{ items: Deficiency[] }>('/api/deficiencies'),
  });

  const { data: actionPlansData, isLoading: actionPlansLoading } = useQuery({
    queryKey: ['actionplans'],
    queryFn: () => api<{ items: ActionPlan[] }>('/api/actionplans'),
  });

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
    mutationFn: ({ id, status }: { id: string; status: ActionPlanStatus }) => api(`/api/actionplans/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
    onSuccess: () => {
      toast.success("Action plan status updated.");
      queryClient.invalidateQueries({ queryKey: ['actionplans'] });
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
      queryClient.invalidateQueries({ queryKey: ['actionplans'] });
    },
  });

  const severityMutation = useMutation({
    mutationFn: ({ id, severity }: { id: string; severity: DeficiencySeverity }) => 
      api(`/api/deficiencies/${id}`, { method: 'PUT', body: JSON.stringify({ severity }) }),
    onSuccess: () => {
      toast.success("Deficiency severity updated based on DoD assessment.");
      queryClient.invalidateQueries({ queryKey: ['deficiencies'] });
    },
  });

  const handleAssess = (id: string) => {
    setActiveDeficiencyId(id);
    setWizardOpen(true);
  };

  const handleWizardComplete = (severity: DeficiencySeverity) => {
    if (activeDeficiencyId) {
      severityMutation.mutate({ id: activeDeficiencyId, severity });
    }
  };

  const findContainer = useCallback((id: string) => {
    return actionPlans.find(ap => ap.id === id)?.status;
  }, [actionPlans]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeContainer = findContainer(active.id as string);
      const overContainerId = over.data.current?.sortable?.containerId || over.id;
      const overContainer = KANBAN_COLUMNS.includes(overContainerId as any) ? overContainerId as ActionPlanStatus : null;

      if (activeContainer && overContainer && activeContainer !== overContainer) {
        setActionPlans(previousPlans => {
          const activeIndex = previousPlans.findIndex(ap => ap.id === active.id);
          if (activeIndex === -1) return previousPlans;
          
          const newPlans = [...previousPlans];
          newPlans[activeIndex] = { ...newPlans[activeIndex], status: overContainer };
          return newPlans;
        });
        
        planMutation.mutate({ id: active.id as string, status: overContainer });
      }
    }
  }, [findContainer, planMutation]);

  const isLoading = deficienciesLoading || actionPlansLoading;
  const mockRole = localStorage.getItem('mockRole') || 'Line 1';

  if (!['Line 2', 'Line 3', 'Admin'].includes(mockRole)) {
    return (
      <AppLayout container>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center flex flex-col items-center gap-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
              <h2 className="text-2xl font-bold">Access Denied</h2>
              <p className="text-muted-foreground">The Deficiency Board is restricted to Line 2, Line 3, and Admin roles.</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

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
      />
    </AppLayout>
  );
}