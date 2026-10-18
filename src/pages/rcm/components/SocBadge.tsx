import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SocBadgeSpec } from '../soc-monitoring-badges';

interface SocBadgeProps {
  spec: SocBadgeSpec;
  /** Layout-only classes (`shrink-0`, `gap-1`, …); tone comes from the spec. */
  className?: string;
  /** Leading icon, e.g. the Reviewed / Pending Review glyph. */
  icon?: ReactNode;
}

/**
 * The ONE badge adapter for both SOCMonitoring views. Tone (className +
 * variant) and label both come from the shared `soc-monitoring-badges`
 * derivation, so a status rename cannot drift between the mobile card and the
 * desktop row. Covers the six duplicated `<Badge>` sites the report flagged
 * (AGENTS.md §"blok JSX yang diduplikasi ≥3× wajib config-driven").
 */
export function SocBadge({ spec, className, icon }: SocBadgeProps) {
  const { t } = useTranslation(['rcm', 'common']);
  const label = spec.labelKey ? t(spec.labelKey, { defaultValue: spec.label }) : spec.label;
  return (
    <Badge variant={spec.variant} className={cn(spec.className, className)}>
      {icon}
      {label}
    </Badge>
  );
}
