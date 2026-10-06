import { useTranslation } from 'react-i18next';
import { RefreshCw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OcrUploadViewProps {
  isProcessingOcr: boolean;
  ocrPreviewUrl: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearPreview: () => void;
  onStartOcr: () => void;
}

export function OcrUploadView({ isProcessingOcr, ocrPreviewUrl, onFileChange, onClearPreview, onStartOcr }: OcrUploadViewProps) {
  const { t } = useTranslation(['bpm', 'common']);

  return (
    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-10 bg-slate-50/50 hover:bg-slate-50/80 transition-all gap-4 min-h-[300px] relative mt-4">
      {isProcessingOcr ? (
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-10 w-10 text-emerald-500 animate-spin" />
          <p className="text-sm font-bold text-slate-700">{t('bpm:ocr.analyzing')}</p>
          <p className="text-xs text-slate-400">{t('bpm:ocr.aiMapping')}</p>
        </div>
      ) : ocrPreviewUrl ? (
        <div className="flex flex-col items-center w-full gap-4">
          <div className="border border-slate-200 rounded-xl p-2 max-w-md bg-white shadow-sm overflow-hidden flex justify-center items-center h-48 w-full">
            <img src={ocrPreviewUrl} className="max-h-full max-w-full object-contain rounded" alt="Preview" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClearPreview} className="rounded-xl">
              {t('bpm:ocr.buttons.retry')}
            </Button>
            <Button
              onClick={onStartOcr}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-bold text-xs uppercase tracking-wider"
            >
              <RefreshCw className="h-4 w-4" /> {t('bpm:ocr.buttons.process')}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center shadow-inner">
            <Upload className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="font-bold text-slate-800 text-sm">{t('bpm:ocr.uploadTitle')}</h3>
            <p className="text-xs text-slate-400 max-w-sm">{t('bpm:ocr.uploadDesc')}</p>
          </div>
          <label className="bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer transition-all uppercase tracking-wider shadow-sm">
            {t('bpm:ocr.buttons.chooseFile')}
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={onFileChange} />
          </label>
        </>
      )}
    </div>
  );
}
