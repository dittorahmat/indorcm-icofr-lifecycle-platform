import { useTranslation } from 'react-i18next';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FileUploadZone } from '../../import/FileUploadZone';

function ZapLoader({ className }: { className?: string }) {
  return <Zap className={cn(' text-amber-500', className)} />;
}

interface IngestionStepProps {
  tbFile: File | null;
  isProcessing: boolean;
  onSelectTbFile: (file: File) => void;
  onProcess: () => void;
}

export function IngestionStep({
  tbFile,
  isProcessing,
  onSelectTbFile,
  onProcess,
}: IngestionStepProps) {
  const { t } = useTranslation(['rcm', 'common', 'scoping']);
  const hasFiles = Boolean(tbFile);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
      <div className="w-full">
        <FileUploadZone type="TB" onFileSelect={onSelectTbFile} selectedFile={tbFile} isProcessing={isProcessing} />
      </div>

      <div
        className={cn(
          'pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all duration-500',
          hasFiles ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-2 pointer-events-none',
        )}
      >
        <div className="flex items-center gap-3 text-xs font-bold text-slate-500 bg-slate-50 px-5 py-2.5 rounded-full border border-slate-200">
          <Zap className={cn('h-3.5 w-3.5', hasFiles ? 'text-amber-500 fill-amber-500' : 'text-slate-300')} />
          {hasFiles ? t('rcm:migration.ingestion.ai_ready') : t('rcm:migration.ingestion.uploadPrompt')}
        </div>
        <Button
          size="lg"
          className="rounded-lg px-6 sm:px-12 font-black uppercase tracking-[0.15em] gap-3 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl h-12 sm:h-14 text-xs transition-all active:scale-95 w-full sm:w-auto min-h-[44px]"
          onClick={onProcess}
          disabled={isProcessing}
        >
          {isProcessing ? <ZapLoader className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {t('rcm:migration.ingestion.process_btn')}
        </Button>
      </div>
    </motion.div>
  );
}
