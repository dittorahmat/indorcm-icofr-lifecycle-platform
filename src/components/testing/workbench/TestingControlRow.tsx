import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Control, TestRecord, Deficiency } from '@shared/types';
import { 
  AlertTriangle, History, ChevronDown, ChevronUp,
  Fingerprint, Clock, Lock, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { ControlTestCard } from '@/components/testing/ControlTestCard';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface TestingControlRowProps {
  control: Control;
  isExpanded: boolean;
  onToggleExpand: () => void;
  latestOpenDeficiency?: Deficiency;
  hasCoolingOffViolation: boolean;
  controlHistory: TestRecord[];
  itemVariants: Variants;
}

export function TestingControlRow({
  control,
  isExpanded,
  onToggleExpand,
  latestOpenDeficiency,
  hasCoolingOffViolation,
  controlHistory,
  itemVariants,
}: TestingControlRowProps) {
  const { t } = useTranslation('testing');

  const isCsaIneffective = Boolean(
    latestOpenDeficiency && (
      latestOpenDeficiency.source?.includes('CSA') || 
      latestOpenDeficiency.source?.includes('TOD')
    )
  );

  return (
    <motion.div 
      variants={itemVariants}
      layout
      className={cn(
        "group relative bg-white border rounded-xl transition-all duration-200 overflow-hidden shadow-xs",
        isExpanded ? "border-primary ring-1 ring-primary/20" : "border-slate-200 hover:border-slate-300",
        (hasCoolingOffViolation || isCsaIneffective) && "border-amber-300 bg-amber-50/15"
      )}
    >
      {/* CARD HEADER / TRIGGER */}
      <div 
        className="p-3 sm:p-3.5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 hover:bg-slate-50/60 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div className={cn(
            "h-9 w-9 sm:h-9.5 sm:w-9.5 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-200 mt-0.5 sm:mt-0",
            isExpanded 
              ? "bg-primary border-primary text-on-primary" 
              : "bg-surface-container border-outline-variant/30 text-primary group-hover:bg-surface-container-high",
            isCsaIneffective && !isExpanded && "bg-amber-50 border-amber-200 text-amber-600"
          )}>
            {hasCoolingOffViolation ? (
              <AlertTriangle className="h-5 w-5" />
            ) : isCsaIneffective ? (
              <ShieldAlert className="h-5 w-5" />
            ) : (
              <Fingerprint className="h-5 w-5" />
            )}
          </div>
          
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn(
                "text-sm sm:text-base font-bold leading-snug line-clamp-2",
                isExpanded ? "text-primary" : "text-slate-900"
              )} title={control.name}>
                {control.name}
              </span>
              <Badge variant="outline" className="font-mono text-xs font-bold text-slate-600 border-slate-200 uppercase tracking-tight rounded shrink-0">
                {control.code}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
               <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 shrink-0" /> {control.frequency}
               </div>
               <div className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 shrink-0" /> {control.nature}
               </div>
               {control.businessProcess && (
                 <div className="hidden md:flex items-center gap-1.5 text-slate-400">
                   <span>•</span>
                   <span>{control.businessProcess}</span>
                 </div>
               )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0 flex-wrap min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {isCsaIneffective ? (
              <Badge className="bg-amber-500 text-white border-none text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                {t('badges.csaIneffective', 'Inefektif CSA')}
              </Badge>
            ) : latestOpenDeficiency && (
              <Badge className="bg-rose-500 text-white border-none text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                {t('badges.openDeficiency')}
              </Badge>
            )}
            {hasCoolingOffViolation && (
              <Badge className="bg-amber-500 text-white border-none text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded">
                {t('coolingOff.violation')}
              </Badge>
            )}
            {controlHistory.length > 0 && (
              <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-none text-xs font-bold uppercase tracking-wider px-2 py-0.5 gap-1 rounded">
                <History className="h-3 w-3 shrink-0" /> {controlHistory.length} {t('badges.tests')}
              </Badge>
            )}
          </div>
          
          <div className={cn(
            "h-11 w-11 min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center transition-all shrink-0 border border-slate-200",
            isExpanded ? "bg-primary-container text-on-primary-container border-primary-container" : "bg-white text-slate-400 hover:text-slate-600"
          )}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-3.5 sm:p-6 border-t border-slate-100 bg-slate-50/40">
              {hasCoolingOffViolation ? (
                <div className="p-6 sm:p-8 bg-rose-50/60 border border-rose-200 rounded-lg text-center space-y-3.5 max-w-2xl mx-auto">
                  <div className="h-12 w-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-base sm:text-lg font-bold text-rose-900">{t('coolingOff.restricted')}</h4>
                    <p className="text-xs sm:text-sm text-rose-700 font-normal leading-relaxed">
                      {t('coolingOff.prohibited')}
                    </p>
                  </div>
                  <Button variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg font-bold text-xs uppercase tracking-wider h-10 px-5 min-h-[40px]">
                    {t('coolingOff.contactAdmin')}
                  </Button>
                </div>
              ) : isCsaIneffective ? (
                <div className="p-6 sm:p-8 bg-amber-50/60 border border-amber-200 rounded-lg text-center space-y-3.5 max-w-2xl mx-auto">
                  <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-base sm:text-lg font-bold text-amber-900">
                      {t('gatekeeper.csaIneffectiveTitle')}
                    </h4>
                    <p className="text-xs sm:text-sm text-amber-800 font-normal leading-relaxed">
                      {t('gatekeeper.csaIneffectiveDescription')}
                    </p>
                  </div>
                  <div className="pt-1">
                    <Badge variant="outline" className="bg-white border-amber-300 text-amber-700 font-mono text-xs px-3 py-1 rounded">
                      {t('gatekeeper.remediationStatus')}
                    </Badge>
                  </div>
                </div>
              ) : (
                <ControlTestCard 
                  control={control} 
                  openDeficiencyDate={latestOpenDeficiency?.identifiedDate as number}
                  history={controlHistory}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
