import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CSAEvidenceMeta } from '@shared/types';

export function EvidenceLocationBadge({ meta, className }: { meta?: CSAEvidenceMeta | null; className?: string }) {
  const { t } = useTranslation(['csa_hub', 'common']);
  if (!meta || !meta.gpsStatus || meta.gpsStatus === 'unavailable') return null;
  if (meta.gpsStatus === 'granted' && meta.lat !== undefined && meta.lng !== undefined) {
    return (
      <Badge variant="outline" className={cn('text-xs font-semibold gap-1 border-emerald-200 bg-emerald-50 text-emerald-700', className)}>
        <MapPin className="h-3 w-3 shrink-0" />
        <span>
          {t('csa_hub:evidence.gpsRecorded', { defaultValue: 'Lokasi tercatat' })}
          {` ${meta.lat.toFixed(4)}, ${meta.lng.toFixed(4)}`}
        </span>
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn('text-xs font-medium gap-1 text-slate-500', className)}>
      <MapPin className="h-3 w-3 shrink-0" />
      <span>
        {meta.gpsStatus === 'denied' && t('csa_hub:evidence.gpsDenied', { defaultValue: 'Lokasi tidak diizinkan' })}
        {meta.gpsStatus === 'timeout' && t('csa_hub:evidence.gpsTimeout', { defaultValue: 'Lokasi tidak tersedia' })}
      </span>
    </Badge>
  );
}
