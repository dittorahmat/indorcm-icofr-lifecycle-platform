import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { SEVERITY_TONE_CLASS, severityShortLabelKey, severityTone } from '@/lib/badge-tone';

export function ReportSeverityBadge({ severity, className = '', outline = false }: { severity: string | undefined; className?: string; outline?: boolean }) {
  const { t } = useTranslation('reports');
  const tone = severityTone(severity);
  return <Badge variant={outline ? 'outline' : undefined} className={`${SEVERITY_TONE_CLASS[tone]} ${className}`.trim()}>{t(severityShortLabelKey(severity))}</Badge>;
}
