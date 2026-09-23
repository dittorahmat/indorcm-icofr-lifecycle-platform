import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Users, History, Calendar, ShieldAlert, Target, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Deficiency, ActionPlan } from '@shared/types';
import { cn } from '@/lib/utils';
import { getDeficiencyDistribution } from '@/lib/compliance-utils';

interface DeficiencyCardProps {
  deficiency: Deficiency;
  actionPlan?: ActionPlan;
}

export function DeficiencyCard({ deficiency, actionPlan }: DeficiencyCardProps) {
  const distribution = getDeficiencyDistribution(deficiency.severity);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: actionPlan?.id || deficiency.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };

  const rawDueDate = actionPlan?.dueDate || actionPlan?.targetDate;
  const parsedDueDate = rawDueDate ? new Date(rawDueDate) : null;
  const isValidDate = parsedDueDate !== null && !isNaN(parsedDueDate.getTime());
  
  // Year-end fallback (31 December of current year) if date is missing/null
  const currentYear = new Date().getFullYear();
  const fallbackDueDate = new Date(currentYear, 11, 31);
  const displayDate = isValidDate ? parsedDueDate : fallbackDueDate;

  const isOverdue = isValidDate && parsedDueDate < new Date() && actionPlan?.status !== 'Verified' && actionPlan?.workflowStatus !== 'Resolved';

  const severityConfig = {
    'Material Weakness': { color: 'bg-rose-500 text-white', icon: AlertTriangle, border: 'border-rose-100' },
    'Significant Deficiency': { color: 'bg-amber-500 text-white', icon: ShieldAlert, border: 'border-amber-100' },
    'Control Deficiency': { color: 'bg-blue-500 text-white', icon: Info, border: 'border-blue-100' },
  } as const;

  const config = severityConfig[deficiency.severity];

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      animate={{ scale: isDragging ? 1.02 : 1 }}
      className="mb-4"
    >
      <Card className={cn(
        "bg-white border-2 transition-all duration-300 relative overflow-hidden group/card",
        isDragging ? "shadow-2xl ring-4 ring-indigo-500/20 border-indigo-400" : "border-slate-100 hover:border-indigo-100 hover:shadow-lg",
        isOverdue && !isDragging && "border-rose-200"
      )}>
        {isOverdue && (
           <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 z-20" />
        )}
        
        <CardHeader className="flex flex-row items-start justify-between p-5 pb-3">
          <div className="space-y-2 w-full pr-2">
             <div className="flex flex-wrap items-center gap-1.5">
                <Badge className={cn("text-xs font-semibold uppercase tracking-wider px-2 py-0.5 border-none shadow-none", config.color)}>
                   {deficiency.severity}
                </Badge>
                <Badge variant="outline" className={cn(
                  "text-xs font-medium uppercase tracking-wider px-2 py-0.5 border-slate-200 bg-white",
                  deficiency.source?.startsWith('Lini 2') ? "text-amber-600 border-amber-200" : "text-indigo-600 border-indigo-200"
                )}>
                   {deficiency.source || 'Manual'}
                </Badge>
                {deficiency.controlCode && (
                  <Badge variant="secondary" className="text-xs font-mono font-semibold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-none">
                    {deficiency.controlCode}
                  </Badge>
                )}
                {deficiency.riskCode && (
                  <Badge variant="secondary" className="text-xs font-mono font-semibold uppercase tracking-wider px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 shadow-none">
                    {deficiency.riskCode}
                  </Badge>
                )}
                {isOverdue && (
                  <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 border-rose-300 bg-rose-100 text-rose-700">
                    OVERDUE
                  </Badge>
                )}
             </div>

             {/* PROMINENT CONTROL HEADER */}
             <CardTitle className="text-sm font-display font-extrabold leading-snug text-slate-900 group-hover/card:text-indigo-600 transition-colors">
               {deficiency.controlName || deficiency.description}
             </CardTitle>
          </div>
          <div {...attributes} {...listeners} className="cursor-grab p-2 -m-2 text-slate-300 hover:text-indigo-500 transition-colors">
            <GripVertical className="h-5 w-5" />
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-0 space-y-4">
          {/* PROMINENT RISK DESCRIPTION BOX */}
          {deficiency.riskDescription && (
             <div className="p-2.5 bg-rose-50/70 border border-rose-200/80 rounded-lg text-rose-950 text-[11px] leading-relaxed flex items-start gap-2">
               <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
               <div>
                 <span className="font-bold text-rose-900 block text-[9px] uppercase tracking-wider mb-0.5">
                   Risiko Terdampak {deficiency.riskCode ? `(${deficiency.riskCode})` : ''}:
                 </span>
                 {deficiency.riskDescription}
               </div>
             </div>
          )}

          {/* FINDING / JUSTIFICATION NOTE BOX */}
          {deficiency.controlName && (
             <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-lg text-slate-700 text-[11px] leading-relaxed">
               <span className="font-bold text-amber-900 block text-[9px] uppercase tracking-wider mb-0.5">Catatan Evaluasi / Temuan Pengujian:</span>
               {deficiency.description}
             </div>
          )}
          <div className="flex items-center justify-between">
              {actionPlan ? (
                 <div className={cn(
                   "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest",
                   isOverdue ? "text-rose-600" : "text-slate-400"
                 )}>
                   <Calendar className="h-3 w-3" />
                   Due: {displayDate.toLocaleDateString()}
                 </div>
              ) : (
                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">No Action Plan</div>
             )}
             
             {actionPlan && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                  <Target className="h-3 w-3 text-indigo-500" />
                  {actionPlan.picName || 'TBD'}
                </div>
             )}
          </div>

          <div className="pt-3 border-t border-slate-50">
             <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">
                <Users className="h-3 w-3 text-slate-300" /> Report Distribution
             </div>
             <div className="flex flex-wrap gap-1.5">
                {distribution.map((stakeholder, i) => (
                  <Badge key={i} variant="outline" className="text-[9px] bg-slate-50/50 border-slate-100 text-slate-500 font-bold uppercase px-2 h-4 shadow-none">
                    {stakeholder}
                  </Badge>
                ))}
             </div>
          </div>

          {(deficiency.correctiveActionTaken || deficiency.remediationEvidence) && (
            <div className="pt-3 border-t border-slate-50 space-y-2.5">
              {deficiency.correctiveActionTaken && (
                <div className="space-y-1">
                  <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" /> Action Taken
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-500 italic font-medium">
                    "{deficiency.correctiveActionTaken}"
                  </p>
                </div>
              )}
              {deficiency.remediationEvidence && (
                <div className="flex items-center gap-2 text-[9px] font-bold text-indigo-600 bg-indigo-50/50 px-2.5 py-1.5 rounded-xl border border-indigo-100 w-fit shadow-sm">
                  <History className="h-3 w-3" /> {deficiency.remediationEvidence}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
