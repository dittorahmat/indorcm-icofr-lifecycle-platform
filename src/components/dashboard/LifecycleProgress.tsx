import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, Circle, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const stages = [
  { id: 'perancangan', label: 'lifecycle.perancangan', icon: Circle },
  { id: 'implementasi', label: 'lifecycle.implementasi', icon: Circle },
  { id: 'evaluasi', label: 'lifecycle.evaluasi', icon: Circle },
  { id: 'remediasi', label: 'lifecycle.remediasi', icon: Circle },
  { id: 'pelaporan', label: 'lifecycle.pelaporan', icon: Circle },
  { id: 'asurans', label: 'lifecycle.asurans', icon: Circle },
];

interface LifecycleProgressProps {
  currentStage?: string;
  workingYear?: string;
}

export function LifecycleProgress({ currentStage = 'evaluasi', workingYear = '2026' }: LifecycleProgressProps) {
  const { t } = useTranslation('dashboard');
  
  const currentIdx = stages.findIndex(s => s.id === currentStage);

  const activeStage = stages[currentIdx] || stages[0];
  const progressPercent = Math.round(((currentIdx + 1) / stages.length) * 100);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 md:p-6 shadow-sm">
      <div className="flex items-start sm:items-center justify-between gap-2 mb-3.5 sm:mb-4 md:mb-6">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 truncate">{t('lifecycle.title')}</h3>
          <p className="text-xs text-slate-500 line-clamp-1">{t('lifecycle.subtitle')}</p>
        </div>
        <div className="px-2.5 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-600 uppercase tracking-wider border border-slate-200 shrink-0">
          FY {workingYear}
        </div>
      </div>

      {/* MOBILE INTERACTIVE HORIZONTAL STEPPER: All 6 SK-5 Phases */}
      <div className="flex md:hidden flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs font-semibold px-0.5">
          <span className="text-slate-900 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="h-5 w-5 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
              {currentIdx + 1}
            </span>
            {t(activeStage.label)}
          </span>
          <span className="text-slate-500 font-mono font-bold">
            {progressPercent}% • {t('lifecycle.phaseStep', { current: currentIdx + 1, total: stages.length })}
          </span>
        </div>

        {/* Progress bar line */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            className="h-full bg-slate-900 rounded-full"
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        {/* Horizontal scrollable pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar -mx-1 px-1 touch-pan-x">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;

            return (
              <div
                key={stage.id}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold shrink-0 transition-all select-none min-h-[36px]",
                  isCompleted 
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs" 
                    : isCurrent
                    ? "bg-white text-slate-900 border-slate-900 ring-2 ring-slate-900/10 shadow-xs"
                    : "bg-slate-50 text-slate-400 border-slate-200"
                )}
              >
                <span className={cn(
                  "h-4 w-4 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  isCompleted ? "bg-white text-slate-900" : isCurrent ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"
                )}>
                  {isCompleted ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : idx + 1}
                </span>
                <span className="whitespace-nowrap font-medium text-xs">
                  {t(stage.label)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* DESKTOP VIEW: Full 6-Stage Timeline */}
      <div className="relative hidden md:flex justify-between">
        {/* Progress Line */}
        <div className="absolute top-4 left-0 w-full h-0.5 bg-slate-100 -z-0" />
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(currentIdx / (stages.length - 1)) * 100}%` }}
          className="absolute top-4 left-0 h-0.5 bg-slate-900 -z-0"
          transition={{ duration: 1, ease: "circOut" }}
        />

        {stages.map((stage, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          
          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center gap-3">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                isCompleted ? "bg-slate-900 border-slate-900 text-white" : 
                isCurrent ? "bg-white border-slate-900 text-slate-900 ring-4 ring-slate-100" :
                "bg-white border-slate-200 text-slate-300"
              )}>
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </div>
              <div className="text-center">
                <p className={cn(
                  "text-xs font-bold uppercase tracking-tight",
                  isCurrent ? "text-slate-900" : "text-slate-400"
                )}>
                  {t(stage.label)}
                </p>
                {isCurrent && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="mt-1 h-1 w-1 bg-slate-900 rounded-full mx-auto"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
