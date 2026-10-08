import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, UploadCloud, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { downloadRCMTemplate } from './rcm-template-downloader';
import type { RCMFlavor } from './rcm-import-types';
import { cn } from '@/lib/utils';

interface RCMIngestionStepProps {
  flavor: RCMFlavor;
  onFlavorChange: (f: RCMFlavor) => void;
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
}

export function RCMIngestionStep({
  flavor,
  onFlavorChange,
  selectedFile,
  onFileSelect,
}: RCMIngestionStepProps) {
  const { t } = useTranslation(['rcm', 'common']);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Flavor Selection Bar */}
      <div className="bg-slate-50 p-4 sm:p-5 rounded-lg border border-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {t('rcm:importWizard.selectFlavor', { defaultValue: 'Pilih Format Regulasi RCM (SK-5 Lampiran 5)' })}
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadRCMTemplate(flavor)}
            className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 text-xs font-semibold gap-2 border-slate-300"
          >
            <Download className="h-3.5 w-3.5 text-slate-600" />
            {t('rcm:importWizard.downloadTemplate', { defaultValue: 'Unduh Template Excel' })} ({flavor})
          </Button>
        </div>

        <RadioGroup
          value={flavor}
          onValueChange={(v) => onFlavorChange(v as RCMFlavor)}
          className="flex flex-wrap gap-4 pt-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="TLC" id="flavor-tlc" />
            <Label htmlFor="flavor-tlc" className="text-xs font-semibold cursor-pointer">
              TLC (Transaction Level)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ELC" id="flavor-elc" />
            <Label htmlFor="flavor-elc" className="text-xs font-semibold cursor-pointer">
              ELC (Entity Level - COSO 17)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ITGC" id="flavor-itgc" />
            <Label htmlFor="flavor-itgc" className="text-xs font-semibold cursor-pointer">
              ITGC (IT General Control)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* File Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors',
          selectedFile
            ? 'border-emerald-500 bg-emerald-50/20'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.txt"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onFileSelect(e.target.files[0]);
            }
          }}
        />

        {selectedFile ? (
          <div className="space-y-2">
            <FileSpreadsheet className="h-10 w-10 text-emerald-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB — Klik untuk mengganti file
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <UploadCloud className="h-10 w-10 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              {t('rcm:importWizard.dragPrompt', { defaultValue: 'Tarik & lepas file spreadsheet RCM di sini' })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('rcm:importWizard.supportedFormats', { defaultValue: 'Mendukung format CSV (.csv) atau Excel (.xlsx)' })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
