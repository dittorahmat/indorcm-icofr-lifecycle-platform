import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BPMCanvasExportOverlayProps {
  isExporting: boolean;
}

export const BPMCanvasExportOverlay: React.FC<BPMCanvasExportOverlayProps> = ({ isExporting }) => {
  const { t } = useTranslation(['bpm']);

  return (
    <AnimatePresence>
      {isExporting && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center"
        >
          <div className="bg-white p-8 rounded-lg shadow-2xl flex flex-col items-center gap-4 text-center max-w-sm">
            <div className="relative">
              <RefreshCw className="h-12 w-12 text-indigo-600 animate-spin" />
              <FileText className="absolute inset-0 m-auto h-5 w-5 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-slate-800 uppercase tracking-tight">{t('bpm:export.title')}</h3>
              <p className="text-sm text-slate-500">{t('bpm:export.generating')}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
