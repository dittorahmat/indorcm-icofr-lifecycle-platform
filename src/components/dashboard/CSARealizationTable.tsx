import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Control, ControlFrequency } from '@shared/types';
import { getSuggestedSampleRange } from '@/lib/compliance-utils';

interface CSARealizationTableProps {
  controls: Control[];
  isLoading?: boolean;
}

export function CSARealizationTable({ controls, isLoading }: CSARealizationTableProps) {
  const { t } = useTranslation(['dashboard', 'common']);

  const realizationData = React.useMemo(() => {
    if (!controls) return [];

    const frequencies: ControlFrequency[] = ["Annual", "Semi-Annual", "Quarterly", "Monthly", "Weekly", "Daily", "Ad-hoc"];

    return frequencies.map(freq => {
      const groupControls = controls.filter(c => c.frequency === freq);
      const total = groupControls.length;
      
      // A control has completed CSA if lastCsaDate is not null, or Lini 2 has validated it.
      const completed = groupControls.filter(c => 
        c.lastCsaDate !== null || 
        c.line2Validation?.status === 'Validated' || 
        c.line2Validation?.status === 'Pending'
      ).length;

      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Get target sample ranges based on Table 22 logic
      // Using risk "High" and nature "Manual" as conservative benchmark reference text for Table 22
      const targetRange = getSuggestedSampleRange(freq, "High", "Manual");

      return {
        frequency: freq,
        total,
        completed,
        percentage,
        targetText: targetRange.label
      };
    }).filter(group => group.total > 0); // Only show frequencies that have controls in system
  }, [controls]);

  if (isLoading) {
    return (
      <Card className="border-slate-200 shadow-xs bg-white rounded-lg">
        <CardHeader className="bg-slate-50/50 border-b py-4 px-5">
          <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="p-5">
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const translateFrequency = (freq: string) => {
    return t(`realizationTable.frequencies.${freq}`, { defaultValue: freq });
  };

  return (
    <Card className="border-slate-200 shadow-xs overflow-hidden bg-white rounded-lg">
      <CardHeader className="bg-slate-50/50 border-b py-4 px-5">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          {t('realizationTable.title')}
        </CardTitle>
        <CardDescription className="text-xs text-slate-500 font-medium uppercase tracking-tight mt-0.5">
          {t('realizationTable.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {/* Mobile View: Stacked Progress Cards (< md) */}
        <div className="md:hidden divide-y divide-slate-100">
          {realizationData.length === 0 ? (
            <div className="p-6 text-center text-slate-400 font-medium text-xs">
              {t('realizationTable.empty')}
            </div>
          ) : (
            realizationData.map((row) => (
              <div key={row.frequency} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs uppercase">
                    {translateFrequency(row.frequency)}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {row.total} {t('realizationTable.controlsCount')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>{t('realizationTable.columns.target')}: <strong className="text-slate-700">{row.targetText}</strong></span>
                  <span className="font-bold text-slate-800">{row.completed} / {row.total} ({row.percentage}%)</span>
                </div>
                <Progress value={row.percentage} className="h-1.5 w-full bg-slate-100" />
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Matrix Table (>= md) */}
        <div className="hidden md:block">
          <Table>
            <TableHeader className="bg-slate-50/20">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-5">
                  {t('realizationTable.columns.frequency')}
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">
                  {t('realizationTable.columns.population')}
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">
                  {t('realizationTable.columns.target')}
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 text-right pr-5">
                  {t('realizationTable.columns.realization')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {realizationData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-400 font-medium text-xs">
                    {t('realizationTable.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                realizationData.map((row) => (
                  <TableRow key={row.frequency} className="hover:bg-slate-50/50">
                    <TableCell className="font-bold text-slate-700 text-xs pl-5">
                      {translateFrequency(row.frequency)}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-slate-600 text-xs">
                      {row.total} {t('realizationTable.controlsCount')}
                    </TableCell>
                    <TableCell className="text-center text-xs font-bold text-slate-500 bg-slate-50/30">
                      {row.targetText}
                    </TableCell>
                    <TableCell className="text-right pr-5">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-bold text-slate-800">
                          {row.completed} / {row.total} ({row.percentage}%)
                        </span>
                        <Progress value={row.percentage} className="h-1 w-20 bg-slate-100" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <div className="p-3 bg-slate-50 border-t flex items-center gap-2 text-xs text-slate-500 font-medium leading-relaxed">
        <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <span>
          {t('realizationTable.footnote')}
        </span>
      </div>
    </Card>
  );
}
