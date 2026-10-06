import { useTranslation } from 'react-i18next';
import { Download, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FileUploadZone } from '../../import/FileUploadZone';
import { downloadTemplate } from './import-templates';
import type { RCMType } from './smart-import-types';

function ZapLoader({ className }: { className?: string }) {
  return <Zap className={cn(' text-amber-500', className)} />;
}

interface IngestionStepProps {
  rcmType: RCMType;
  tbFile: File | null;
  rcmFile: File | null;
  isProcessing: boolean;
  onRcmTypeChange: (v: RCMType) => void;
  onSelectTbFile: (file: File) => void;
  onSelectRcmFile: (file: File) => void;
  onProcess: () => void;
}

export function IngestionStep({
  rcmType,
  tbFile,
  rcmFile,
  isProcessing,
  onRcmTypeChange,
  onSelectTbFile,
  onSelectRcmFile,
  onProcess,
}: IngestionStepProps) {
  const { t } = useTranslation(['rcm', 'common', 'scoping']);
  const hasFiles = Boolean(tbFile || rcmFile);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
      <div className="bg-slate-50 p-4 sm:p-6 rounded-lg border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            {t('rcm:migration.ingestion.selectRcmType')}
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadTemplate(rcmType)}
            className="h-11 sm:h-7 min-h-[44px] sm:min-h-0 text-xs font-bold gap-2 uppercase tracking-widest rounded-md"
          >
            <Download className="h-3 w-3" /> {t('rcm:migration.ingestion.templateBtn', { type: rcmType })}
          </Button>
        </div>
        <RadioGroup value={rcmType} onValueChange={(v) => onRcmTypeChange(v as RCMType)} className="flex flex-wrap gap-4 sm:gap-6">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="TLC" id="tlc" />
            <Label htmlFor="tlc" className="text-xs font-bold text-slate-700">
              {t('rcm:migration.ingestion.typeTlc')}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ELC" id="elc" />
            <Label htmlFor="elc" className="text-xs font-bold text-slate-700">
              {t('rcm:migration.ingestion.typeElc')}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ITGC" id="itgc" />
            <Label htmlFor="itgc" className="text-xs font-bold text-slate-700">
              {t('rcm:migration.ingestion.typeItgc')}
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileUploadZone type="TB" onFileSelect={onSelectTbFile} selectedFile={tbFile} isProcessing={isProcessing} />
        <FileUploadZone type="RCM" onFileSelect={onSelectRcmFile} selectedFile={rcmFile} isProcessing={isProcessing} />
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
