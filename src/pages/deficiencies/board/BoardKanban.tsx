import { DndContext, DragOverlay, closestCorners, pointerWithin } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { SensorDescriptor, SensorOptions } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { DeficiencyCard } from '@/components/deficiencies/DeficiencyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { BoardColumn } from './BoardColumn';
import { KANBAN_COLUMNS, MOBILE_STATUS_KEY } from './board-constants';
import type { ActionPlan, Deficiency } from '@shared/types';

interface BoardKanbanProps {
  sensors: SensorDescriptor<SensorOptions>[];
  isLoading: boolean;
  filteredDeficiencies: Deficiency[];
  actionPlans: ActionPlan[];
  userRole: string;
  isAggregateMode: boolean;
  selectedIds: string[];
  mobileStatus: string;
  dragPlan: ActionPlan | null;
  dragDeficiency: Deficiency | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onAssess: (dId: string) => void;
  onEditPlan: (plan: ActionPlan) => void;
  onStatusChange: (apId: string, action: string) => void;
  onToggleSelect: (id: string) => void;
  onMobileStatus: (status: string) => void;
}

export function BoardKanban({
  sensors,
  isLoading,
  filteredDeficiencies,
  actionPlans,
  userRole,
  isAggregateMode,
  selectedIds,
  mobileStatus,
  dragPlan,
  dragDeficiency,
  onDragStart,
  onDragEnd,
  onAssess,
  onEditPlan,
  onStatusChange,
  onToggleSelect,
  onMobileStatus,
}: BoardKanbanProps) {
  const { t } = useTranslation(['deficiency', 'workflow', 'common']);
  // Exactly one Kanban tree may be mounted at a time: duplicate droppable /
  // sortable ids across the desktop + mobile trees break dnd-kit activation
  // and collision. `useIsMobile` shares the Tailwind `md` breakpoint (768px).
  const isMobileView = useIsMobile();

  const columnProps = {
    deficiencies: filteredDeficiencies,
    actionPlans,
    onAssess,
    isSelectionMode: isAggregateMode,
    selectedIds,
    onToggleSelect,
    role: userRole,
    onEditPlan,
    onStatusChange,
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={(args) => {
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) return pointerCollisions;
        return closestCorners(args);
      }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {!isMobileView ? (
        /* DESKTOP VIEW: Kanban columns (sole mounted tree on desktop) */
        <div
          className="flex-1 overflow-x-auto max-w-full touch-pan-x overscroll-x-contain table-scroll-hint pb-6 snap-x scrollbar-thin scrollbar-thumb-slate-200 [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)]"
          data-testid="deficiency-kanban-desktop"
        >
          {isLoading ? (
            <div className="flex gap-6">
              {KANBAN_COLUMNS.map((status) => (
                <div key={status} className="w-80 flex-shrink-0 space-y-4">
                  <Skeleton className="h-10 w-3/4 rounded-lg" />
                  <Skeleton className="h-32 w-full rounded-lg" />
                  <Skeleton className="h-32 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="kanban-rail flex gap-8 pb-4 h-full min-h-[600px]">
              {KANBAN_COLUMNS.map((status) => (
                <BoardColumn key={status} status={status} {...columnProps} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* MOBILE VIEW: Status tabs + vertical card stream (sole mounted tree on mobile) */
        <div className="flex-1" data-testid="deficiency-mobile-tabs">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-28 w-full rounded-lg" />
            </div>
          ) : (
            <>
              <div
                className="flex gap-1.5 overflow-x-auto max-w-full touch-pan-x overscroll-x-contain no-scrollbar pb-3"
                role="tablist"
                aria-label={t('board.statusFilter', { defaultValue: 'Deficiency status' })}
              >
                {KANBAN_COLUMNS.map((status) => {
                  const count = actionPlans.filter((ap) => (ap.workflowStatus || ap.status) === status).length;
                  const isActive = mobileStatus === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => onMobileStatus(status)}
                      className={cn(
                        'flex-1 min-h-[44px] min-w-[100px] rounded-lg border px-3 text-xs font-bold uppercase tracking-wider transition-colors',
                        isActive ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200',
                      )}
                    >
                      {t(MOBILE_STATUS_KEY[status] as string, { defaultValue: status })} ({count})
                    </button>
                  );
                })}
              </div>
              <BoardColumn key={mobileStatus} status={mobileStatus} {...columnProps} fullWidth alwaysShowActions />
            </>
          )}
        </div>
      )}
      <DragOverlay dropAnimation={null}>
        {dragPlan && dragDeficiency ? (
          <DeficiencyCard deficiency={dragDeficiency} actionPlan={dragPlan} draggable={false} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
