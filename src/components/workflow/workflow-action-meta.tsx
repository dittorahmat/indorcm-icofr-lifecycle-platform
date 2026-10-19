import React from 'react';
import {
  CheckCircle2, XCircle, Send, MessageSquare, RotateCcw, Search, History, Trash2, Undo2,
} from 'lucide-react';

/**
 * One presentation map for every workflow/approval timeline (icon, dot tone and
 * the rejection emphasis). Both the generic `WorkflowHistoryTimeline` and the
 * scoping `ApprovalHistoryTimeline` render the same actions; keeping the switches
 * here stops the two from drifting.
 */

export function workflowActionIcon(action: string): React.ReactNode {
  switch (action) {
    case 'Submit': return <Send className="h-3 w-3" />;
    case 'Review': return <Search className="h-3 w-3" />;
    case 'Approve': return <CheckCircle2 className="h-3 w-3" />;
    case 'Reject': return <XCircle className="h-3 w-3" />;
    case 'Rollback': return <RotateCcw className="h-3 w-3" />;
    case 'Update': return <History className="h-3 w-3" />;
    case 'Request Deletion':
    case 'Approve Deletion': return <Trash2 className="h-3 w-3" />;
    case 'Reject Deletion': return <Undo2 className="h-3 w-3" />;
    default: return <MessageSquare className="h-3 w-3" />;
  }
}

export function workflowActionDotClass(action: string): string {
  switch (action) {
    case 'Submit': return 'bg-blue-500';
    case 'Review': return 'bg-indigo-500';
    case 'Approve': return 'bg-green-500';
    case 'Reject': return 'bg-red-500';
    case 'Rollback': return 'bg-rose-500';
    case 'Update': return 'bg-amber-500';
    case 'Request Deletion': return 'bg-amber-600';
    case 'Approve Deletion': return 'bg-rose-600';
    default: return 'bg-slate-500';
  }
}

export function isWorkflowRejection(action: string): boolean {
  return action === 'Reject' || action === 'Reject Deletion';
}
