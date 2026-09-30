import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, RotateCcw, X, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

interface CapturedEvidence {
  name: string;
  url: string;
}

interface EvidenceCaptureButtonProps {
  recordId: string;
}

/**
 * One-thumb field evidence capture for Lini 1 on mobile.
 * Native file/camera picker (zero new dependencies) with preview
 * BEFORE upload. A failed upload keeps the selected file in place
 * for retry — no draft or card state is lost.
 */
export function EvidenceCaptureButton({ recordId }: EvidenceCaptureButtonProps) {
  const { t } = useTranslation(['csa_hub', 'common']);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [pending, setPending] = React.useState<{ file: File; previewUrl: string } | null>(null);
  const [uploaded, setUploaded] = React.useState<CapturedEvidence[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    return () => {
      if (pending) URL.revokeObjectURL(pending.previewUrl);
    };
  }, [pending]);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (pending) URL.revokeObjectURL(pending.previewUrl);
    setPending({ file, previewUrl: URL.createObjectURL(file) });
    setFailed(false);
  };

  const doUpload = async () => {
    if (!pending || isUploading) return;
    setIsUploading(true);
    setFailed(false);
    try {
      const formData = new FormData();
      formData.append('file', pending.file);
      formData.append('csaId', recordId);
      const res = await api<{ url: string }>('/api/upload', { method: 'POST', body: formData });
      setUploaded((prev) => [...prev, { name: pending.file.name, url: res.url }]);
      URL.revokeObjectURL(pending.previewUrl);
      setPending(null);
      toast.success(t('page.evidence.uploaded', { defaultValue: 'Bukti terunggah' }));
    } catch (err: unknown) {
      // Keep the pending file so the user can retry without reselecting.
      setFailed(true);
      const message = err instanceof Error ? err.message : undefined;
      toast.error(
        message || t('page.evidence.uploadError', { defaultValue: 'Gagal mengunggah. File tetap tersimpan untuk dicoba lagi.' })
      );
    } finally {
      setIsUploading(false);
    }
  };

  const cancelPending = () => {
    if (pending) URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
    setFailed(false);
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
            <p className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">{pending.file.name}</p>
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
              onClick={doUpload}
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
            <li
              key={item.url}
              className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{item.name}</span>
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
