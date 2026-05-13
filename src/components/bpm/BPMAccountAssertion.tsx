import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Info, Shield, Loader2, Save
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AccountAssertion } from '@shared/types';
import { useTranslation } from 'react-i18next';

interface BPMAccountAssertionProps {
  localAssertion: Partial<AccountAssertion>;
  assertionLoading: boolean;
  isAssertionDirty: boolean;
  onAssertionChange: (field: keyof AccountAssertion, value: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function BPMAccountAssertion({ 
  localAssertion, 
  assertionLoading, 
  isAssertionDirty, 
  onAssertionChange, 
  onSave,
  isSaving
}: BPMAccountAssertionProps) {
  const { t } = useTranslation(['bpm', 'common']);

  const assertionFields = [
    { key: 'assertionE', label: t('assertions.tooltip.eo.label'), desc: t('assertions.tooltip.eo.desc') },
    { key: 'assertionC', label: t('assertions.tooltip.c.label'), desc: t('assertions.tooltip.c.desc') },
    { key: 'assertionA', label: t('assertions.tooltip.a.label'), desc: t('assertions.tooltip.a.desc') },
    { key: 'assertionCo', label: t('assertions.tooltip.co.label'), desc: t('assertions.tooltip.co.desc') },
    { key: 'assertionRo', label: t('assertions.tooltip.ro.label'), desc: t('assertions.tooltip.ro.desc') },
    { key: 'assertionVa', label: t('assertions.tooltip.va.label'), desc: t('assertions.tooltip.va.desc') },
    { key: 'assertionPd', label: t('assertions.tooltip.pd.label'), desc: t('assertions.tooltip.pd.desc') },
  ] as const;

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-indigo-50/50 py-3 px-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-600" />
            <CardTitle className="text-sm font-bold uppercase tracking-wide text-indigo-900">{t('assertions.title')}</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            {isAssertionDirty && (
              <Button size="sm" onClick={onSave} disabled={isSaving} className="h-7 px-3 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700">
                {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                {t('common:actions.save')}
              </Button>
            )}
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 font-bold text-xs">{t('assertions.subtitle')}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <TooltipProvider>
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="divide-x divide-slate-100">
                {assertionFields.map((field) => (
                  <TableHead key={field.key} className="text-center w-[120px]">
                    <Tooltip>
                      <TooltipTrigger className="cursor-help flex items-center justify-center gap-1 mx-auto">
                        <span className="font-bold text-xs uppercase">{field.label}</span>
                        <Info className="h-3 w-3 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs"><strong>{field.label}</strong></p>
                        <p className="text-xs mt-1">{field.desc}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="divide-x divide-slate-100">
                {assertionFields.map((field) => (
                  <TableCell key={field.key} className="p-0">
                    <Select 
                      value={(localAssertion as any)[field.key] || "N"} 
                      onValueChange={(v) => onAssertionChange(field.key as keyof AccountAssertion, v)} 
                      disabled={assertionLoading}
                    >
                      <SelectTrigger className="h-10 border-none rounded-none focus:ring-0 text-xs shadow-none text-center font-bold">
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Y">{t('common:yes')}</SelectItem>
                        <SelectItem value="N">{t('common:no')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
