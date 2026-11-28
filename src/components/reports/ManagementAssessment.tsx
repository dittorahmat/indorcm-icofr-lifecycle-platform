import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Shield, Lock, Loader2, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { MobileDesktopBanner } from '@/components/layout/MobileDesktopBanner';
import type { Deficiency } from '@shared/types';
import { SEVERITY_TONE_CLASS, severityLabelKey, severityTone } from '@/lib/badge-tone';

/** Lampiran 11 keeps Control Deficiency out of the escalation table. */
const escalatesToBoard = (deficiency: Deficiency) => severityTone(deficiency.severity) !== 'cd';

interface ManagementAssessmentProps {
  isSigned: boolean;
  isEffective: boolean;
  onSignOff: () => void;
  isSigningOff: boolean;
  settings: any;
  summaryData: any;
}

export function ManagementAssessment({
  isSigned,
  isEffective,
  onSignOff,
  isSigningOff,
  settings,
  summaryData
}: ManagementAssessmentProps) {
  const { t } = useTranslation('reports');

  return (
    <div className="pt-6">
      <div className="flex flex-col sm:flex-row sm:justify-end mb-6 gap-2 no-print">
        {!isSigned ? (
          <Button onClick={onSignOff} variant="destructive" className="font-bold shadow-md h-11 sm:h-9 min-h-[44px] sm:min-h-0 gap-2 w-full sm:w-auto justify-center" disabled={isSigningOff}>
            {isSigningOff ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {t('actions.signAndLock')}
          </Button>
        ) : (
          <Badge className="bg-indigo-600 text-white px-5 py-2 text-xs font-bold shadow-sm gap-2 border-none">
            <CheckCircle2 className="h-4 w-4" /> {t('assessment.periodFinalized')}
          </Badge>
        )}
      </div>
      
      <Card className="print:shadow-none border-slate-200 relative overflow-hidden bg-white">
        <AnimatePresence>
          {isSigned && (
            <motion.div initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 0.1 }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="border-[16px] border-emerald-600 text-emerald-600 font-black text-9xl p-12 rotate-[-25deg] uppercase tracking-tighter opacity-20">{t('assessment.signed')}</div>
            </motion.div>
          )}
        </AnimatePresence>
        <CardHeader className="text-center border-b border-slate-100 pb-10 pt-12">
          <div className="flex justify-center mb-6"><Shield className="h-14 w-14 text-indigo-600" /></div>
          <CardTitle className="text-2xl font-bold uppercase tracking-tight text-slate-900">{t('assessment.title')}</CardTitle>
          <CardDescription className="text-sm font-medium text-slate-500 mt-2">{t('assessment.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 sm:space-y-10 py-6 sm:py-10 px-4 sm:px-8 lg:px-12">
          <div className="space-y-6 text-justify leading-relaxed">
            <p className="text-sm font-semibold text-slate-800">{t('assessment.directorsStatement', { companyName: settings?.companyName || 'IndoRCM' })}</p>
            
            {!isEffective ? (
              <div className="p-5 bg-rose-50 border border-rose-100 rounded-lg shadow-sm">
                <p className="font-bold text-rose-800 mb-2 text-center uppercase tracking-wide">{t('assessment.conclusionIneffective')}</p>
                <p className="text-sm text-rose-700 leading-relaxed">
                  {t('assessment.ineffectiveDesc')}
                </p>
              </div>
            ) : (
              <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-lg shadow-sm">
                <p className="font-bold text-emerald-800 mb-2 text-center uppercase tracking-wide">{t('assessment.conclusionEffective')}</p>
                <p className="text-sm text-emerald-700 leading-relaxed">
                  {t('assessment.effectiveDesc')}
                </p>
              </div>
            )}

            <ol className="list-decimal pl-6 space-y-5 text-sm text-slate-700 font-medium">
              <li>{t('assessment.statement1', { companyName: settings?.companyName || 'IndoRCM', date: new Date(settings?.signedOffDate || Date.now()).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) })}</li>
              <li>{t('assessment.statement2')}</li>
              <li>{t('assessment.statement3')}</li>
              <li>{t('assessment.statement4')}</li>
            </ol>
          </div>

          <div className="bg-slate-50 p-4 sm:p-8 rounded-xl border border-slate-200 space-y-5 shadow-sm">
            <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4 text-orange-500" /> {t('assessment.deficiencyTitle')}
            </h3>
            <div className="md:hidden">
              <MobileDesktopBanner />
            </div>
            <div className="rounded-lg border border-slate-200 overflow-x-auto max-w-full touch-pan-x overscroll-x-contain table-scroll-hint bg-white">
              <Table className="text-xs min-w-[560px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-slate-600 uppercase tracking-wider">{t('testing.table.notes')}</TableHead>
                    <TableHead className="w-[150px] font-bold text-slate-600 uppercase tracking-wider">{t('assessment.severity')}</TableHead>
                    <TableHead className="w-[200px] font-bold text-slate-600 uppercase tracking-wider">{t('assessment.remediationPlan')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(summaryData?.allDeficiencies || []).filter(escalatesToBoard).map((def: Deficiency) => (
                    <TableRow key={def.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-slate-800 py-3">{def.description}</TableCell>
                      <TableCell className="py-3"><Badge variant="outline" className={cn('text-xs font-bold border-none', SEVERITY_TONE_CLASS[severityTone(def.severity)])}>{t(severityLabelKey(def.severity))}</Badge></TableCell>
                      <TableCell className="text-slate-500 py-3">{t('assessment.monitorProgress')}</TableCell>
                    </TableRow>
                  ))}
                  {!(summaryData?.allDeficiencies || []).some(escalatesToBoard) && (
                    <TableRow><TableCell colSpan={3} className="text-center py-6 text-slate-400 font-medium">{t('assessment.noDeficiencies')}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 lg:gap-24 pt-10 sm:pt-16">
            <div className="text-center space-y-8 sm:space-y-24">
              <p className="font-bold text-slate-900 border-b border-slate-200 pb-2 text-sm uppercase tracking-wide">Chief Financial Officer (CFO)</p>
              <p className="font-bold text-lg text-slate-900 underline decoration-2 underline-offset-8">{settings?.cfoName || 'Belum Ditunjuk'}</p>
            </div>
            <div className="text-center space-y-8 sm:space-y-24">
              <p className="font-bold text-slate-900 border-b border-slate-200 pb-2 text-sm uppercase tracking-wide">Chief Executive Officer (CEO)</p>
              <p className="font-bold text-lg text-slate-900 underline decoration-2 underline-offset-8">{settings?.ceoName || 'Belum Ditunjuk'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
