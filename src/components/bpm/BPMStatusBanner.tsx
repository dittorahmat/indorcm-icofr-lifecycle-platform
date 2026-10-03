import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';
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
            <p className="text-xs font-bold text-emerald-900 uppercase tracking-widest">{t('bpm:baseline.status')}</p>
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
            <p className="text-xs font-bold text-rose-900 uppercase tracking-widest">Source Data Missing</p>
            <p className="text-xs font-medium text-rose-700/80 leading-relaxed">The GL Snapshot used for this simulation was not found. Please re-perform scoping for this cycle.</p>
          </div>
        </motion.div>
      ) : !snapLoading && (
        <motion.div 
          key="no-baseline-banner"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm"
        >
          <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-0.5 flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-900 uppercase tracking-widest">{t('bpm:baseline.emptyTitle', { year: viewYear })}</p>
            <p className="text-xs font-medium text-amber-700/80 leading-relaxed">{t('bpm:baseline.empty', { year: viewYear })}</p>
          </div>
          <Link
            to="/scoping"
            className="shrink-0 inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-widest shadow-sm transition-colors"
          >
            {t('bpm:baseline.openScoping')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
