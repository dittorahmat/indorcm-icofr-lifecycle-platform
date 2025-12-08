import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MainHeader } from '@/components/layout/MainHeader';
import { api } from '@/lib/api-client';
import type { Deficiency, ActionPlan, ActionPlanStatus } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { DeficiencyCard } from '@/components/deficiencies/DeficiencyCard';
import { toast } from 'sonner';
const KANBAN_COLUMNS: ActionPlanStatus[] = ["Draft", "In Progress", "Resolved", "Verified"];
function KanbanColumn({ status, deficiencies, actionPlans }: { status: ActionPlanStatus; deficiencies: Deficiency[]; actionPlans: ActionPlan[] }) {
  const plansInColumn = actionPlans.filter(ap => ap.status === status);
  return (
    <div className="w-72 md:w-80 flex-shrink-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">{status}</h2>
        <span className="text-sm font-medium bg-muted text-muted-foreground rounded-full px-2 py-0.5">{plansInColumn.length}</span>
      </div>
      <SortableContext id={status} items={plansInColumn.map(ap => ap.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4 h-full min-h-[200px] bg-muted/50 rounded-lg p-2">
          {plansInColumn.map(ap => {
            const deficiency = deficiencies.find(d => d.id === ap.deficiencyId);
            if (!deficiency) return null;
            return <DeficiencyCard key={ap.id} deficiency={deficiency} actionPlan={ap} />;
          })}
        </div>
      </SortableContext>
    </div>
  );
}
export function DeficiencyBoard() {
  const queryClient = useQueryClient();
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
  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ActionPlanStatus }) => api(`/api/actionplans/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
    onSuccess: () => {
      toast.success("Action plan status updated.");
      queryClient.invalidateQueries({ queryKey: ['actionplans'] });
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
      // Revert optimistic update by refetching from the server
      queryClient.refetchQueries({ queryKey: ['actionplans'] });
    },
  });
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeContainer = findContainer(active.id as string);
      const overContainerId = over.data.current?.sortable?.containerId || over.id;
      const overContainer = KANBAN_COLUMNS.includes(overContainerId) ? overContainerId as ActionPlanStatus : null;
      if (activeContainer && overContainer && activeContainer !== overContainer) {
        const activeIndex = actionPlans.findIndex(ap => ap.id === active.id);
        // Optimistic update
        setActionPlans(previousPlans => {
            const newPlans = [...previousPlans];
            newPlans[activeIndex] = {
                ...newPlans[activeIndex],
                status: overContainer,
            };
            return newPlans;
        });
        // Fire mutation
        mutation.mutate({ id: active.id as string, status: overContainer });
      }
    }
  }
  function findContainer(id: string) {
    return actionPlans.find(ap => ap.id === id)?.status;
  }
  const isLoading = deficienciesLoading || actionPlansLoading;
  return (
    <div className="flex flex-col h-screen bg-muted/40">
      <MainHeader />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10">
            <h1 className="text-3xl font-bold mb-6">Deficiency Board</h1>
          </div>
        </div>
        <div className="flex-1 overflow-x-auto pb-8">
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
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
                <div className="flex gap-6">
                  {KANBAN_COLUMNS.map(status => (
                    <KanbanColumn
                      key={status}
                      status={status}
                      deficiencies={deficienciesData?.items || []}
                      actionPlans={actionPlans}
                    />
                  ))}
                </div>
              </DndContext>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}