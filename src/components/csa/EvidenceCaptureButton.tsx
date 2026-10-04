import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, RotateCcw, X, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEvidenceUpload } from '@/hooks/csa/use-evidence-upload';
import { useFieldLocation } from '@/hooks/csa/use-field-location';
import { EvidenceLocationBadge } from './EvidenceLocationBadge';
import type { CSAEvidenceMeta } from '@shared/types';

interface CapturedEvidence {
  name: string;
  url: string;
  meta?: CSAEvidenceMeta;
}

interface EvidenceCaptureButtonProps {
  recordId: string;
}

/**
 * One-thumb field evidence capture for Lini 1 on mobile.
 * Unified behavior: select -> preview -> compressed upload with
 * consistent metadata (csaId) + optional GPS Fase-1. A failed
 * upload keeps the selected file for retry without losing state.
 */
export function EvidenceCaptureButton({ recordId }: EvidenceCaptureButtonProps) {
  const { t } = useTranslation(['csa_hub', 'common']);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = React.useState<CapturedEvidence[]>([]);
  const lastNameRef = React.useRef<string>('');
  const lastMetaRef = React.useRef<CapturedEvidence['meta']>(undefined);
  const { pending, failed, isUploading, selectFile, cancelPending, uploadPending, retry, setGpsMeta } = useEvidenceUpload({
    csaId: recordId,
    onUploaded: (_target, url) => {
      setUploaded((prev) => [...prev, { name: lastNameRef.current || url, url, meta: lastMetaRef.current }]);
    },
  });
  const { captureLocation } = useFieldLocation();
  const [locating, setLocating] = React.useState(false);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    lastNameRef.current = file.name;
    selectFile(0, 'field', file);
    setLocating(true);
    void captureLocation().then((loc) => {
      const meta = { lat: loc.lat, lng: loc.lng, accuracyM: loc.accuracyM, capturedAt: loc.capturedAt, gpsStatus: loc.status };
      lastMetaRef.current = meta;
      setGpsMeta(meta);
      setLocating(false);
    });
  };

  const isImage = pending?.file.type.startsWith('image/');

  return (
    <div className="space-y-3" data-testid={`evidence-capture-${recordId}`}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleSelect}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full min-h-[44px] text-xs font-semibold gap-2 border-border"
        onClick={() => fileRef.current?.click()}
      >
        <Camera className="h-4 w-4" />
        <span>{t('page.evidence.capture', { defaultValue: 'Foto Bukti' })}</span>
        {uploaded.length > 0 && (
          <span className="ml-auto font-bold text-primary">
            {t('page.evidence.attachedCount', { defaultValue: '{{count}} bukti terlampir', count: uploaded.length })}
          </span>
        )}
      </Button>

      {pending && (
        <div className="rounded-lg border border-border bg-card p-3 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t('page.evidence.previewTitle', { defaultValue: 'Pratinjau bukti lapangan' })}
          </p>
          <div className="flex items-center gap-3">
            {isImage ? (
              <img
                src={pending.previewUrl}
                alt={pending.file.name}
                className="h-16 w-16 rounded-md object-cover border border-border shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-md border border-dashed border-border flex items-center justify-center shrink-0">
                <Camera className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate text-xs font-semibold text-foreground">{pending.file.name}</p>
              {locating ? (
                <p className="text-xs text-muted-foreground">{t('csa_hub:evidence.gpsLocating', { defaultValue: 'Mencatat lokasi...' })}</p>
              ) : null}
            </div>
          </div>
          {failed && (
            <p className="text-xs font-semibold text-red-600">
              {t('page.evidence.uploadError', { defaultValue: 'Gagal mengunggah. File tetap tersimpan untuk dicoba lagi.' })}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="flex-1 min-h-[44px] text-xs font-semibold gap-1.5"
              disabled={isUploading}
              onClick={() => (failed ? retry() : uploadPending())}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : failed ? (
                <RotateCcw className="h-4 w-4" />
              ) : null}
              <span>
                {isUploading
                  ? t('page.evidence.uploading', { defaultValue: 'Mengunggah...' })
                  : failed
                    ? t('page.evidence.retry', { defaultValue: 'Coba Lagi' })
                    : t('page.evidence.upload', { defaultValue: 'Unggah' })}
              </span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-[44px] min-w-[44px] text-xs font-semibold"
              disabled={isUploading}
              onClick={cancelPending}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">{t('page.evidence.cancel', { defaultValue: 'Batal' })}</span>
            </Button>
          </div>
        </div>
      )}

      {uploaded.length > 0 && (
        <ul className="space-y-2">
          {uploaded.map((item) => (
            <li key={item.url} className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{item.name}</span>
              {item.meta?.gpsStatus === 'granted' && <EvidenceLocationBadge meta={item.meta} />}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-[44px] min-w-[44px] shrink-0 text-xs font-semibold text-primary"
                onClick={() => window.open(item.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                <span className="sr-only">{t('page.evidence.openEvidence', { defaultValue: 'Buka bukti' })}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
