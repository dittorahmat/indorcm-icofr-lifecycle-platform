import { Badge } from '@/components/ui/badge';
import { findingSeverityTone } from './findings-helpers';

const SEVERITY_BADGE_TONE: Record<string, string> = {
  mw: 'bg-red-50 text-red-700 border-red-300 font-semibold text-xs rounded-md',
  sd: 'bg-amber-50 text-amber-700 border-amber-300 font-semibold text-xs rounded-md',
  cd: 'bg-slate-100 text-slate-700 border-slate-300 font-semibold text-xs rounded-md',
};

const SEVERITY_BADGE_LABEL: Record<string, string> = { mw: 'MW', sd: 'SD', cd: 'CD' };

export function ReportSeverityBadge({ severity, className = '', outline = false }: { severity: string | undefined; className?: string; outline?: boolean }) {
  const tone = findingSeverityTone(severity);
  return <Badge variant={outline ? 'outline' : undefined} className={`${SEVERITY_BADGE_TONE[tone]} ${className}`.trim()}>{SEVERITY_BADGE_LABEL[tone]}</Badge>;
}
