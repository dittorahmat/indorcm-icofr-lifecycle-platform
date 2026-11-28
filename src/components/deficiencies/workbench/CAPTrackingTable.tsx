import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ClipboardCheck, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  SlidersHorizontal 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActionPlan, Deficiency } from '@shared/types';
import { format } from 'date-fns';

interface CAPTrackingTableProps {
  deficiencies: Deficiency[];
  actionPlans: ActionPlan[];
  onAssess: (deficiencyId: string) => void;
  onEditPlan: (plan: ActionPlan) => void;
  onStatusChange: (apId: string, action: string) => void;
  role: string;
}

export function CAPTrackingTable({
  deficiencies,
  actionPlans,
  onAssess,
  onEditPlan,
  onStatusChange,
  role,
}: CAPTrackingTableProps) {
  const { t } = useTranslation(['deficiency', 'common']);

  // Map action plans by deficiencyId
  const planByDefId = React.useMemo(() => {
    const map = new Map<string, ActionPlan>();
    actionPlans.forEach((p) => map.set(p.deficiencyId, p));
    return map;
  }, [actionPlans]);

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'Material Weakness':
        return (
          <Badge className="bg-rose-500 text-white border-none text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded">
            MW
          </Badge>
        );
      case 'Significant Deficiency':
        return (
          <Badge className="bg-amber-500 text-white border-none text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded">
            SD
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-200 text-slate-700 border-none text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded">
            CD
          </Badge>
        );
    }
  };

  const getWorkflowBadge = (plan?: ActionPlan) => {
    if (!plan) {
      return (
        <Badge variant="outline" className="border-slate-300 text-slate-500 text-xs font-medium">
          {t('captable.noPlan', { defaultValue: 'Belum Ada CAP' })}
        </Badge>
      );
    }

    switch (plan.workflowStatus) {
      case 'Resolved':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-none text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {t('captable.resolved', { defaultValue: 'Selesai' })}
          </Badge>
        );
      case 'In Approval':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-none text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded">
            {t('captable.inApproval', { defaultValue: 'Approval' })}
          </Badge>
        );
      case 'In Review':
        return (
          <Badge className="bg-sky-100 text-sky-800 border-none text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded">
            {t('captable.inReview', { defaultValue: 'Review L2' })}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-800 border-none text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded">
            {t('captable.inProgress', { defaultValue: 'Proses Remediasi' })}
          </Badge>
        );
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-x-auto max-w-full touch-pan-x overscroll-x-contain bg-white shadow-xs">
      <Table className="min-w-[1040px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[110px] text-xs uppercase font-bold text-slate-700 py-2 px-3">Kode Temuan</TableHead>
            <TableHead className="text-xs uppercase font-bold text-slate-700 min-w-[340px] py-2 px-3">Uraian Temuan & Kontrol</TableHead>
            <TableHead className="w-[90px] text-center text-xs uppercase font-bold text-slate-700 py-2 px-3">Keparahan</TableHead>
            <TableHead className="text-xs uppercase font-bold text-slate-700 min-w-[180px] py-2 px-3">Owner / PIC</TableHead>
            <TableHead className="w-[130px] text-xs uppercase font-bold text-slate-700 py-2 px-3">Target Deadline</TableHead>
            <TableHead className="w-[140px] text-center text-xs uppercase font-bold text-slate-700 py-2 px-3">Status CAP</TableHead>
            <TableHead className="w-[120px] text-center text-xs uppercase font-bold text-slate-700 py-2 px-3">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deficiencies.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-slate-400 text-xs font-normal py-2 px-3">
                {t('captable.empty', { defaultValue: 'Tidak ada defisiensi yang sesuai dengan filter.' })}
              </TableCell>
            </TableRow>
          ) : (
            deficiencies.map((d) => {
              const plan = planByDefId.get(d.id);
              const targetDate = plan?.targetDate || plan?.dueDate;
              const formattedDate = targetDate ? format(new Date(targetDate), 'dd MMM yyyy') : '-';
              const isOverdue = targetDate && new Date(targetDate).getTime() < Date.now() && plan?.workflowStatus !== 'Resolved';

              return (
                <TableRow key={d.id} className="hover:bg-slate-50/60 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-primary py-2 px-3">
                    {d.controlCode || d.id}
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900 leading-snug">
                        {d.controlName || d.description}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        {d.source}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-2 px-3">
                    {getSeverityBadge(d.severity)}
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{plan?.picName || t('card.picUnassigned', { defaultValue: 'TBD' })}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <Clock className={cn("h-3.5 w-3.5 shrink-0", isOverdue ? "text-rose-500" : "text-slate-400")} />
                      <span className={cn(isOverdue && "text-rose-600 font-bold")}>
                        {formattedDate}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-2 px-3">
                    {getWorkflowBadge(plan)}
                  </TableCell>
                  <TableCell className="text-center py-2 px-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAssess(d.id)}
                        className="h-8 px-2 text-xs font-bold text-primary hover:bg-surface-container"
                        title={t('board.assessSeverity', { defaultValue: 'Nilai Keparahan (DoD)' })}
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
                        DoD
                      </Button>
                      {plan && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditPlan(plan)}
                          className="h-8 px-2 text-xs font-bold text-secondary hover:bg-secondary/10"
                          title="Edit Action Plan"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
