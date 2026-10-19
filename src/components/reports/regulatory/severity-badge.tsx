import { Badge } from '@/components/ui/badge';
import { SEVERITY_TONE_CLASS, severityTone } from '@/lib/badge-tone';

const SEVERITY_BADGE_LABEL: Record<string, string> = { mw: 'MW', sd: 'SD', cd: 'CD' };

export function ReportSeverityBadge({ severity, className = '', outline = false }: { severity: string | undefined; className?: string; outline?: boolean }) {
  const tone = severityTone(severity);
  return <Badge variant={outline ? 'outline' : undefined} className={`${SEVERITY_TONE_CLASS[tone]} ${className}`.trim()}>{SEVERITY_BADGE_LABEL[tone]}</Badge>;
}
