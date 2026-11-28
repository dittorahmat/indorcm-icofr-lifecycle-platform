import { useTranslation } from 'react-i18next';
import type { UseFormReturn } from 'react-hook-form';
import type { CSAFormValues } from '@/hooks/use-csa';
import { LayoutDashboard, Plus } from 'lucide-react';
import { FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ControlOption, SampleFieldEntry } from './csa-form-types';

interface SampleMatrixTableProps {
  form: UseFormReturn<CSAFormValues>;
  isReadOnly: boolean;
  activeControls: ControlOption[];
  fields: SampleFieldEntry[];
  onAddSample: () => void;
}

export function SampleMatrixTable({ form, isReadOnly, activeControls, fields, onAddSample }: SampleMatrixTableProps) {
  const { t } = useTranslation();

  return (
    <div className="hidden md:block">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-2">
          <h4 className="text-xs font-black uppercase text-slate-700 flex items-center gap-2 min-w-0">
            <LayoutDashboard className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{t('csa_hub:form.summaryTitle')}</span>
          </h4>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {!isReadOnly && (
              <Button
                type="button"
                onClick={onAddSample}
                variant="outline"
                size="sm"
                className="h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 w-full min-[420px]:w-auto justify-center"
              >
                <Plus className="h-3.5 w-3.5 mr-1 shrink-0" /> {t('csa_hub:form.addManualSample')}
              </Button>
            )}
            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-xs font-bold">
              {t('csa_hub:form.quickToggle')}
            </Badge>
          </div>
        </div>
        <div className="border rounded-lg overflow-x-auto max-w-full touch-pan-x overscroll-x-contain shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="divide-x">
                <TableHead className="w-10 text-xs font-bold">#</TableHead>
                <TableHead className="text-xs font-bold min-w-[200px]">{t('csa_hub:form.sampleReference')}</TableHead>
                <TooltipProvider>
                  {activeControls.map((ctrl) => (
                    <TableHead key={ctrl.id} className="text-xs font-black text-center uppercase tracking-tighter w-24">
                      <Tooltip>
                        <TooltipTrigger className="w-full h-full cursor-help line-clamp-2 text-left leading-tight">
                          {ctrl.name}
                        </TooltipTrigger>
                        <TooltipContent className="bg-mancity-pattern text-primary-foreground p-2 text-xs max-w-xs">
                          <p className="font-bold">
                            [{ctrl.code}] {ctrl.name}
                          </p>
                          <p className="opacity-80 mt-1">{ctrl.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                  ))}
                </TooltipProvider>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, sIdx) => (
                <TableRow key={field.id} className="divide-x hover:bg-slate-50/50 transition-colors">
                  <TableCell className="text-xs font-bold text-slate-400 text-center">{sIdx + 1}</TableCell>
                  <TableCell className="text-xs font-medium py-1 px-3">
                    <FormField
                      control={form.control}
                      name={`samples.${sIdx}.sampleRef`}
                      render={({ field: f }) => (
                        <Input
                          {...f}
                          value={(f.value as string) ?? ''}
                          disabled={isReadOnly}
                          className="h-8 text-xs font-bold border-transparent hover:border-slate-200 focus:border-slate-400 bg-transparent transition-all"
                          placeholder={t('csa_hub:form.typeReference') as string}
                        />
                      )}
                    />
                    <div className="text-xs text-slate-400 px-3">
                      {t('csa_hub:form.mobile.idLabel', { defaultValue: 'ID' })}: {field.glRowId?.substring(0, 8) || t('csa_hub:form.manualEntry')}
                    </div>
                  </TableCell>
                  {activeControls.map((ctrl) => (
                    <TableCell key={ctrl.id} className="text-center p-0">
                      <FormField
                        control={form.control}
                        name={`samples.${sIdx}.controlResults.${ctrl.id}.implemented`}
                        render={({ field: f }) => (
                          <div className="flex items-center justify-center h-full min-h-[40px]">
                            <Checkbox
                              checked={f.value as boolean}
                              onCheckedChange={f.onChange}
                              disabled={isReadOnly}
                              className={cn('h-5 w-5', f.value ? 'text-green-600 border-green-600' : 'text-slate-300')}
                            />
                          </div>
                        )}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
