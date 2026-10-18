import { Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { Application } from '@shared/types';
import {
  criticalityBadge,
  itgcStatusBadge,
  significanceBadge,
} from '../soc-monitoring-badges';
import { SocBadge } from './SocBadge';

interface ApplicationCardProps {
  application: Application;
  onView: (application: Application) => void;
  onEdit: (application: Application) => void;
}

/**
 * Mobile adapter (`block md:hidden`) for one significant application. Every
 * badge decision comes from the shared seam — this file owns layout only.
 */
export function ApplicationCard({ application, onView, onEdit }: ApplicationCardProps) {
  const { t } = useTranslation(['rcm', 'common']);

  return (
    <div
      data-testid={`application-card-${application.id}`}
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onView(application)}
          className="min-w-0 text-left text-xs font-bold text-foreground hover:text-indigo-600 hover:underline min-h-[44px]"
        >
          {application.name}
        </button>
        <SocBadge spec={significanceBadge(!!application.isSignificant)} className="shrink-0" />
      </div>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <SocBadge spec={criticalityBadge(application.criticality)} />
        <SocBadge spec={itgcStatusBadge(application.statusITGC)} className="shrink-0" />
        <span className="text-xs text-muted-foreground">
          {t('rcm:application_detail.linkedControls', { defaultValue: 'Kontrol' })}:{' '}
          <span className="font-bold">{application.linkedControlCount || 0}</span>
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-h-[44px] text-xs font-semibold"
          onClick={() => onView(application)}
        >
          {t('rcm:application_detail.title', { defaultValue: 'Details' })}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t('common:actions.edit', { defaultValue: 'Edit application' })}
          className="min-h-[44px] min-w-[44px] px-3"
          onClick={() => onEdit(application)}
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
