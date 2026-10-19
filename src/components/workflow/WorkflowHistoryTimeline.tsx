import React from 'react';
import { WorkflowHistoryEntry, ApprovalHistoryEntry } from '@shared/types';
import { format } from 'date-fns';
import { 
  User, Clock, History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { isWorkflowRejection, workflowActionDotClass, workflowActionIcon } from './workflow-action-meta';

interface WorkflowHistoryTimelineProps {
  history: (WorkflowHistoryEntry | ApprovalHistoryEntry)[];
}

export function WorkflowHistoryTimeline({ history }: WorkflowHistoryTimelineProps) {
  const { t } = useTranslation(['common', 'bpm']);
  
  if (!history || history.length === 0) {
    return (
      <div className="py-10 text-center border-2 border-dashed rounded-lg bg-slate-50/50">
        <History className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-400 font-medium">{t('bpm:csa.historyEmpty', { defaultValue: 'No activity recorded yet.' })}</p>
      </div>
    );
  }

  // Sort history by timestamp descending (newest first)
  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
      {sortedHistory.map((entry, index) => (
        <div key={entry.id || index} className="relative flex items-start gap-6 group">
          {/* Timeline Dot */}
          <div className={cn(
            "absolute left-0 mt-1.5 h-8 w-8 rounded-full border-4 border-white flex items-center justify-center text-white shadow-sm z-10 transition-transform group-hover:scale-110",
            workflowActionDotClass(entry.action)
          )}>
            {workflowActionIcon(entry.action)}
          </div>

          <div className="flex-1 ml-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{entry.action}</span>
                <Badge variant="outline" className="text-xs h-4 px-1.5 py-0 uppercase font-bold tracking-tight bg-slate-50">
                  {entry.role}
                </Badge>
                {'toStatus' in entry && entry.toStatus && (
                   <Badge className="text-xs h-3.5 px-1 bg-slate-100 text-slate-600 border-none font-black uppercase">
                     → {entry.toStatus}
                   </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                {format(entry.timestamp, 'dd MMM yyyy, HH:mm')}
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-lg p-3 shadow-sm group-hover:border-slate-200 transition-colors">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 p-1 rounded bg-slate-50 border border-slate-100">
                  <User className="h-3 w-3 text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter mb-1">{entry.userId}</p>
                  <p className={cn(
                    "text-xs leading-relaxed",
                    isWorkflowRejection(entry.action) || entry.action === 'Rollback' ? "text-red-700 font-medium not-italic" : "text-slate-600"
                  )}>
                    {entry.note || "No comments provided."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
