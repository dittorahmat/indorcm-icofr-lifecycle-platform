import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BPMStatusBannerProps {
  activeSim: any;
  activeSnap: any;
  snapLoading: boolean;
  viewYear: string;
}

export function BPMStatusBanner({
  activeSim,
  activeSnap,
  snapLoading,
  viewYear,
}: BPMStatusBannerProps) {
  const { t } = useTranslation(['bpm', 'common']);

  return (
    <AnimatePresence mode="wait">
      {activeSim && activeSim.status === 'Approved' ? (
        <motion.div 
          key="approved-banner"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-4 shadow-sm"
        >
          <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest">{t('bpm:baseline.status')}</p>
            <p className="text-xs font-medium text-emerald-700/80 leading-relaxed">{t('bpm:baseline.description', { year: viewYear })}</p>
          </div>
        </motion.div>
      ) : !activeSnap && !snapLoading && activeSim?.glSnapshotId ? (
        <motion.div 
          key="missing-snapshot-banner"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center gap-4 shadow-sm"
        >
          <div className="h-10 w-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-rose-900 uppercase tracking-widest">Source Data Missing</p>
            <p className="text-xs font-medium text-rose-700/80 leading-relaxed">The GL Snapshot used for this simulation was not found. Please re-perform scoping for this cycle.</p>
          </div>
        </motion.div>
      ) : !snapLoading && (
        <motion.div 
          key="rejected-banner"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="py-12 text-center border-2 border-dashed rounded-2xl bg-slate-50/50 border-slate-200"
        >
          <div className="h-14 w-14 bg-slate-100 text-slate-300 rounded-xl flex items-center justify-center mx-auto mb-4 border border-white shadow-sm">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h3 className="text-md font-display font-bold text-slate-600 uppercase tracking-tight">{t('bpm:baseline.status')} {t('common:status.rejected')}</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto mt-2 font-medium leading-relaxed px-6">
            {t('bpm:baseline.empty', { year: viewYear })}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
