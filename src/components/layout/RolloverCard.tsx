import { Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { canRunRollover } from '@shared/rollover-roles';
import { useCurrentRole } from '@/hooks/use-current-role';

interface RolloverCardProps {
  /** The working year is the target; the card describes the clone from the year before. */
  workingYear: string;
  onOpen: () => void;
  /** Placement (margin) from the page, so a hidden card leaves no empty wrapper behind. */
  className?: string;
}

/**
 * The year-end rollover's entry card — one component for the three screens that
 * can start one (`ScopingPage`, `RCMELCPage`, `RCMTLCPage`), so the gate reads the
 * same policy as the guard (`ROLLOVER_ROLES`, #103, `shared/rollover-roles.ts`)
 * and cannot drift per screen. Renders nothing for a role the guard would refuse,
 * instead of inviting a 403.
 */
export function RolloverCard({ workingYear, onOpen, className }: RolloverCardProps) {
  const { t } = useTranslation('scoping');
  const role = useCurrentRole();

  if (!canRunRollover(role)) return null;

  return (
    <Card className={cn('bg-teal-50/50 border-teal-200/60 shadow-sm rounded-lg overflow-hidden', className)}>
      <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-wrap min-w-0">
        <div className="flex gap-3">
          <div className="bg-teal-500/10 p-2.5 rounded-xl h-10 w-10 flex items-center justify-center text-teal-600 shrink-0">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-teal-900 text-sm">{t('rollover.title')}</h3>
            <p className="text-xs text-teal-700/80 mt-1 max-w-2xl leading-relaxed">
              {t('rollover.description', { year: workingYear, prevYear: (parseInt(workingYear) - 1).toString() })}
            </p>
          </div>
        </div>
        <Button
          onClick={onOpen}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 h-11 sm:h-10 min-h-[44px] w-full sm:w-auto justify-center rounded-lg shrink-0"
        >
          {t('rollover.confirm')}
        </Button>
      </CardContent>
    </Card>
  );
}
