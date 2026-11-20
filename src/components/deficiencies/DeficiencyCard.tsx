import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Users, History, Calendar, ShieldAlert, Target, AlertTriangle, CheckCircle2, ClipboardCheck, Compass, FlaskConical, FileQuestion } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Deficiency, ActionPlan } from '@shared/types';
import { cn } from '@/lib/utils';
import { getDeficiencyDistribution } from '@/lib/compliance-utils';
import { SEVERITY_SOLID_CLASS, severityLabelKey, severityTone } from '@/lib/badge-tone';
import { useTranslation } from 'react-i18next';

interface DeficiencyCardProps {
  deficiency: Deficiency;
  actionPlan?: ActionPlan;
  /**
   * When false the card renders purely presentational (e.g. inside a
   * `DragOverlay`) and registers no sortable/droppable identity, so the
   * overlay can never steal collision from the dragged item.
   */
  draggable?: boolean;
}

/**
 * Visual identity of each evaluation origin across the Three Lines Model.
 * Icons mirror the instrument that produced the finding (SK-5/DKU.MBU/11/2024).
 */
type SourceBadgeConfig = {
  label: string;
  color: string;
  icon: LucideIcon;
};

export function DeficiencyCard({ deficiency, actionPlan, draggable = true }: DeficiencyCardProps) {
  const { t } = useTranslation(['deficiency', 'reports']);
  const distribution = getDeficiencyDistribution(deficiency.severity);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: actionPlan?.id || deficiency.id,
    disabled: !draggable,
  });

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

  // Tone comes from `@/lib/badge-tone`: the old map here was a fourth copy of the
  // severity vocabulary (keyed by the English string, with an `icon`/`border` no
  // one read), and an unrecognised severity made `config.color` throw mid-render.
  const severityClass = SEVERITY_SOLID_CLASS[severityTone(deficiency.severity)];

  const getSourceConfig = (source?: string): SourceBadgeConfig => {
    switch (source) {
      case 'Lini 1 - CSA':
        return {
          label: t('sources.csa', 'CSA Ineffective'),
          color: 'text-blue-700 bg-blue-50 border-blue-200',
          icon: ClipboardCheck,
        };
      case 'Lini 2 - TOD Review':
        return {
          label: t('sources.tod', 'TOD Review (Design)'),
          color: 'text-amber-800 bg-amber-50 border-amber-200',
          icon: Compass,
        };
      case 'Lini 2 - CSA Review':
      case 'Lini 2 - CSA Validation':
      case 'Lini 2 - TOE Review':
        return {
          label: t('sources.toe', 'TOE Review (Operation)'),
          color: 'text-purple-700 bg-purple-50 border-purple-200',
          icon: FlaskConical,
        };
      case 'Lini 3 - Audit':
        return {
          label: t('sources.audit', 'External / SPI Audit'),
          color: 'text-rose-700 bg-rose-50 border-rose-200',
          icon: ShieldAlert,
        };
      default:
        return {
          label: source || t('sources.unspecified', 'Manual / Unspecified'),
          color: 'text-slate-700 bg-slate-50 border-slate-200',
          icon: FileQuestion,
        };
    }
  };

  const sourceConfig = getSourceConfig(deficiency.source);

  return (
    <div
      ref={draggable ? setNodeRef : undefined}
      style={draggable ? style : undefined}
      {...(draggable ? attributes : {})}
      className={cn(isDragging && draggable && "opacity-40")}
    >
    <motion.div
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
        
        <CardHeader
          {...(draggable ? listeners : {})}
          className="flex flex-col min-[420px]:flex-row min-[420px]:items-start justify-between p-3.5 pb-2.5 cursor-grab active:cursor-grabbing select-none flex-wrap gap-2 min-w-0"
        >
          <div className="space-y-1.5 w-full pr-2">
             <div className="flex flex-wrap items-center gap-1.5">
                <Badge className={cn("text-xs font-semibold uppercase tracking-wider px-2 py-0.5 border-none shadow-none rounded-md", severityClass)}>
                   {t(severityLabelKey(deficiency.severity), { ns: 'reports' })}
                </Badge>
                <Badge variant="outline" className={cn(
                  "text-xs font-semibold uppercase tracking-wider px-2 py-0.5 border rounded-md shadow-none flex items-center gap-1",
                  sourceConfig.color
                )}>
                   <sourceConfig.icon className="h-3 w-3 shrink-0" aria-hidden="true" />
                   {sourceConfig.label}
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
                  <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 border-rose-300 bg-rose-100 text-rose-700 rounded-md">
                    {t('card.overdue', 'Overdue')}
                  </Badge>
                )}
             </div>

             {/* PROMINENT CONTROL HEADER */}
              <CardTitle className="text-sm font-display font-extrabold leading-snug text-slate-900 group-hover/card:text-indigo-600 transition-colors break-words min-w-0">
               {deficiency.controlName || deficiency.description}
             </CardTitle>
          </div>
          <div aria-hidden="true" className="p-2 -m-2 text-slate-300 hover:text-indigo-500 transition-colors">
            <GripVertical className="h-5 w-5" />
          </div>
        </CardHeader>

        <CardContent className="p-3.5 pt-0 space-y-3">
          {/* PROMINENT RISK DESCRIPTION BOX */}
          {deficiency.riskDescription && (
             <div className="p-2 bg-rose-50/70 border border-rose-200/80 rounded-lg text-rose-950 text-xs leading-relaxed flex items-start gap-2">
               <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
               <div>
                   <span className="font-bold text-rose-900 block text-xs uppercase tracking-wider mb-0.5">
                     {t('card.riskAffected', { defaultValue: 'Affected Risk' })} {deficiency.riskCode ? `(${deficiency.riskCode})` : ''}:
                   </span>
                 {deficiency.riskDescription}
               </div>
             </div>
          )}

          {/* FINDING / JUSTIFICATION NOTE BOX */}
          {deficiency.controlName && (
             <div className="p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-lg text-slate-700 text-xs leading-relaxed">
                <span className="font-bold text-amber-900 block text-xs uppercase tracking-wider mb-0.5">{t('card.evalNote', { defaultValue: 'Evaluation Note / Test Finding:' })}</span>
               {deficiency.description}
             </div>
          )}
          <div className="flex items-center justify-between flex-wrap gap-2">
              {actionPlan ? (
                  <div className={cn(
                    "flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest",
                    isOverdue ? "text-rose-600" : "text-slate-400"
                  )}>
                    <Calendar className="h-3 w-3" />
                    {t('card.dueDate', { defaultValue: 'Due: {{date}}', date: displayDate.toLocaleDateString() })}
                  </div>
               ) : (
                 <div className="text-xs font-bold text-slate-300 uppercase tracking-widest">{t('card.noActionPlan', 'No Action Plan')}</div>
             )}
             
             {actionPlan && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                  <Target className="h-3 w-3 text-indigo-500" />
                  {actionPlan.picName || t('card.picUnassigned', 'TBD')}
                </div>
             )}
          </div>

          <div className="pt-2.5 border-t border-slate-100">
             <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5">
                <Users className="h-3 w-3 text-slate-300" /> {t('card.reportDistribution', 'Report Distribution')}
             </div>
             <div className="flex flex-wrap gap-1.5">
                {distribution.map((stakeholder, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-slate-50/50 border-slate-100 text-slate-500 font-bold uppercase px-2 h-4 shadow-none">
                    {stakeholder}
                  </Badge>
                ))}
             </div>
          </div>

          {(deficiency.correctiveActionTaken || deficiency.remediationEvidence) && (
            <div className="pt-3 border-t border-slate-50 space-y-2.5">
              {deficiency.correctiveActionTaken && (
                <div className="space-y-1">
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" /> {t('card.actionTaken', 'Action Taken')}
                  </div>
                    <p className="text-xs leading-relaxed text-slate-500 font-medium">
                    "{deficiency.correctiveActionTaken}"
                  </p>
                </div>
              )}
              {deficiency.remediationEvidence && (
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50/50 px-2.5 py-1.5 rounded-lg border border-indigo-100 w-fit shadow-sm">
                  <History className="h-3 w-3" /> {deficiency.remediationEvidence}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
    </div>
  );
}
