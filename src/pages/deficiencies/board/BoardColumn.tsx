import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  Clock,
  FileText,
  Send,
  ShieldAlert,
  XCircle,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { can } from '@shared/entity-authority';
import { Checkbox } from '@/components/ui/checkbox';
import { DeficiencyCard } from '@/components/deficiencies/DeficiencyCard';
import { cn } from '@/lib/utils';
import type { ActionPlan, Deficiency } from '@shared/types';

interface BoardColumnProps {
  status: string;
  deficiencies: Deficiency[];
  actionPlans: ActionPlan[];
  onAssess: (dId: string) => void;
  onEditPlan: (plan: ActionPlan) => void;
  isSelectionMode: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  role: string;
  onStatusChange: (apId: string, action: string) => void;
  fullWidth?: boolean;
  alwaysShowActions?: boolean;
}

function useColumnConfig(status: string) {
  const { t } = useTranslation('deficiency');
  switch (status) {
    case 'Ineffective':
      return { title: t('board.columns.ineffective', 'Ineffective'), color: 'text-slate-400', bg: 'bg-slate-100', icon: FileText };
    case 'In Review':
      return { title: t('board.columns.review', 'In Review'), color: 'text-amber-500', bg: 'bg-amber-50', icon: Clock };
    case 'In Approval':
      return { title: t('board.columns.approval', 'In Approval'), color: 'text-blue-500', bg: 'bg-blue-50', icon: Zap };
    case 'Resolved':
      return { title: t('board.columns.resolved', 'Resolved'), color: 'text-emerald-500', bg: 'bg-emerald-50', icon: CheckCircle2 };
    default:
      return { title: status, color: 'text-slate-400', bg: 'bg-slate-100', icon: FileText };
  }
}

export function BoardColumn({
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
  alwaysShowActions,
}: BoardColumnProps) {
  const { t } = useTranslation('deficiency');
  const config = useColumnConfig(status);
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const plansInColumn = actionPlans.filter((ap) => (ap.workflowStatus || ap.status) === status);

  return (
    <div
      className={cn(
        'flex flex-col h-full group/column snap-start',
        fullWidth ? 'w-full' : 'w-80 max-w-[85vw] sm:max-w-none flex-shrink-0',
      )}
    >
      <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between mb-2.5 px-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center border-2 border-white shadow-sm', config.bg)}>
            <config.icon className={cn('h-3.5 w-3.5', config.color)} />
          </div>
          <h2 className="font-display font-bold text-slate-900 tracking-tight text-sm">{config.title}</h2>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-xs font-bold bg-white border-slate-200 text-slate-400 px-1.5 h-4.5 flex items-center justify-center min-w-[20px]"
        >
          {plansInColumn.length}
        </Badge>
      </div>

      <div
        ref={setNodeRef}
        data-droppable-id={status}
        className={cn(
          'flex-1 rounded-lg border-2 border-dashed p-2.5 sm:p-3 transition-all duration-300',
          isOver
            ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-300/40'
            : 'bg-slate-50/50 border-slate-200/60 group-hover/column:bg-slate-50/80 group-hover/column:border-slate-300',
          fullWidth ? 'min-h-[200px]' : 'min-h-[500px]',
        )}
      >
        <SortableContext id={status} items={plansInColumn.map((ap) => ap.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {plansInColumn.map((ap) => {
              const deficiency = deficiencies.find((d) => d.id === ap.deficiencyId);
              if (!deficiency) return null;
              return (
                <div key={ap.id} className="relative group">
                  <div className={cn('transition-all duration-300', isSelectionMode ? 'pl-10' : '')}>
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

                  <div
                    className={cn(
                      'flex flex-col gap-2 mt-2 px-1 transition-all duration-300',
                      alwaysShowActions
                        ? 'opacity-100 [&_button]:min-h-[44px]'
                        : 'opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:transform [@media(hover:hover)]:translate-y-[-5px] [@media(hover:hover)]:group-hover:translate-y-0 focus-within:opacity-100 focus-visible:opacity-100 [&_button]:min-h-[44px]',
                    )}
                  >
                    <div className="flex gap-2">
                      {(status === 'Ineffective' || can(role, 'deficiency:edit-any-plan')) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-xs font-bold uppercase tracking-widest bg-white border-slate-200 rounded-lg justify-center"
                          onClick={() => onEditPlan(ap)}
                        >
                          {t('actions.actionPlan', 'Action Plan')}
                        </Button>
                      )}
                      {status === 'Ineffective' && can(role, 'deficiency:create-plan') && (
                        <Button
                          size="sm"
                          className="flex-1 h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-xs font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg justify-center"
                          onClick={() => onStatusChange(ap.id, 'Submit')}
                        >
                          <Send className="h-3 w-3 mr-1 shrink-0" /> {t('workflow:submitPlan', { ns: 'workflow' })}
                        </Button>
                      )}
                    </div>

                    {status === 'In Review' && ['Line 2', 'Admin'].includes(role) && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-xs font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg justify-center"
                          onClick={() => onStatusChange(ap.id, 'Review')}
                        >
                          <Zap className="h-3 w-3 mr-1 shrink-0" /> {t('board.actions.passReview', 'Pass Review')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-xs font-bold uppercase tracking-widest text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg justify-center"
                          onClick={() => onStatusChange(ap.id, 'Reject')}
                        >
                          <XCircle className="h-3 w-3 mr-1 shrink-0" /> {t('board.actions.reject', 'Reject')}
                        </Button>
                      </div>
                    )}

                    {status === 'In Approval' && ['Admin'].includes(role) && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-xs font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg justify-center"
                          onClick={() => onStatusChange(ap.id, 'Approve')}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1 shrink-0" /> {t('board.actions.approve', 'Approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-xs font-bold uppercase tracking-widest text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg justify-center"
                          onClick={() => onStatusChange(ap.id, 'Reject')}
                        >
                          <XCircle className="h-3 w-3 mr-1 shrink-0" /> {t('board.actions.reject', 'Reject')}
                        </Button>
                      </div>
                    )}
                  </div>

                  {!isSelectionMode && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className={cn(
                        'absolute top-3 right-10 rounded-lg shadow-md bg-white transition-all hover:text-indigo-600 focus-visible:opacity-100',
                        alwaysShowActions
                          ? 'h-11 w-11 min-h-[44px] min-w-[44px] opacity-100'
                          : 'h-11 w-11 min-h-[44px] min-w-[44px] opacity-100 [@media(hover:hover)]:h-8 [@media(hover:hover)]:w-8 [@media(hover:hover)]:min-h-[32px] [@media(hover:hover)]:min-w-[32px] [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100',
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
