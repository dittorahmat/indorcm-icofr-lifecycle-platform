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
  Info, Shield, Loader2, Save, Fingerprint
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AccountAssertion } from '@shared/types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

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
    { key: 'assertionE', label: t('assertions.tooltip.eo.label'), desc: t('assertions.tooltip.eo.desc'), color: 'text-primary' },
    { key: 'assertionC', label: t('assertions.tooltip.c.label'), desc: t('assertions.tooltip.c.desc'), color: 'text-blue-600' },
    { key: 'assertionA', label: t('assertions.tooltip.a.label'), desc: t('assertions.tooltip.a.desc'), color: 'text-emerald-600' },
    { key: 'assertionCo', label: t('assertions.tooltip.co.label'), desc: t('assertions.tooltip.co.desc'), color: 'text-amber-600' },
    { key: 'assertionVa', label: t('assertions.tooltip.va.label'), desc: t('assertions.tooltip.va.desc'), color: 'text-purple-600' },
    { key: 'assertionRo', label: t('assertions.tooltip.ro.label'), desc: t('assertions.tooltip.ro.desc'), color: 'text-rose-600' },
    { key: 'assertionPd', label: t('assertions.tooltip.pd.label'), desc: t('assertions.tooltip.pd.desc'), color: 'text-slate-600' },
  ] as const;

  return (
    <Card className="border-slate-200 shadow-md overflow-hidden rounded-[2rem] bg-white">
      <CardHeader className="bg-slate-50/50 py-5 px-8 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-2xl bg-slate-50 text-primary flex items-center justify-center border border-slate-200 shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-display font-bold uppercase tracking-widest text-slate-900">{t('assertions.title')}</CardTitle>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Management Assertions (Tabel 13)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <AnimatePresence>
              {isAssertionDirty && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <Button size="sm" onClick={onSave} disabled={isSaving} className="h-9 px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest gap-2 bg-slate-900 hover:bg-slate-800 shadow-md">
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {t('common:actions.save')}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-widest px-3 h-6">{t('assertions.subtitle')}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <TooltipProvider>
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow className="divide-x divide-slate-100 border-b border-slate-100">
                {assertionFields.map((field) => (
                  <TableHead key={field.key} className="text-center w-[120px] py-4">
                    <Tooltip>
                      <TooltipTrigger className="cursor-help flex items-center justify-center gap-2 mx-auto group">
                        <span className={cn("font-bold text-[10px] uppercase tracking-widest transition-colors", field.color)}>{field.label}</span>
                        <Info className="h-3 w-3 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs p-3 rounded-xl shadow-xl border-slate-200">
                        <p className="text-xs font-bold text-slate-900"><strong>{field.label}</strong></p>
                        <p className="text-[11px] mt-1 text-slate-500 leading-relaxed italic">"{field.desc}"</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="divide-x divide-slate-100">
                {assertionFields.map((field) => {
                  const val = (localAssertion as any)[field.key] || "N";
                  return (
                    <TableCell key={field.key} className="p-0">
                      <Select 
                        value={val} 
                        onValueChange={(v) => onAssertionChange(field.key as keyof AccountAssertion, v)} 
                        disabled={assertionLoading}
                      >
                        <SelectTrigger className={cn(
                          "h-12 border-none rounded-none focus:ring-0 text-xs shadow-none text-center font-bold transition-colors",
                          val === 'Y' ? "bg-emerald-50/30 text-emerald-700" : "bg-white text-slate-400"
                        )}>
                          <div className="w-full flex justify-center items-center gap-2">
                            {val === 'Y' && <Fingerprint className="h-3 w-3 opacity-50" />}
                            <SelectValue placeholder="-" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                          <SelectItem value="Y" className="text-xs font-bold text-emerald-600">{t('common:yes')}</SelectItem>
                          <SelectItem value="N" className="text-xs font-bold text-slate-400">{t('common:no')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}

import { AnimatePresence, motion } from 'framer-motion';
