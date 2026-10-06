import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { DoDCounters } from './dod-types';

interface DoDSummaryCardsProps {
  counters: DoDCounters;
  severityFilter: string;
  remediationFilter: string;
  onSelectSeverity: (v: string) => void;
  onSelectRemediation: (v: string) => void;
  onResetAll: () => void;
}

type CardTheme = 'slate' | 'red' | 'amber' | 'blue' | 'emerald';

interface CardConfig {
  key: string;
  titleKey: string;
  hintKey: string;
  count: number;
  theme: CardTheme;
  active: boolean;
  onClick: () => void;
}

const THEME: Record<CardTheme, { card: string; label: string; value: string; badge: string; ring: string }> = {
  slate: {
    card: 'bg-slate-50 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300',
    label: 'text-slate-600',
    value: 'text-slate-900',
    badge: 'text-slate-600 bg-white border-slate-200',
    ring: 'focus:ring-slate-400 bg-slate-100 border-slate-400 ring-2 ring-slate-400/40 shadow-sm',
  },
  red: {
    card: 'bg-red-50 border-red-200 hover:bg-red-100/70 hover:border-red-300',
    label: 'text-red-700',
    value: 'text-red-700',
    badge: 'text-red-700 bg-white border-red-200',
    ring: 'focus:ring-red-500 bg-red-100 border-red-400 ring-2 ring-red-400/40 shadow-sm',
  },
  amber: {
    card: 'bg-amber-50 border-amber-200 hover:bg-amber-100/70 hover:border-amber-300',
    label: 'text-amber-700',
    value: 'text-amber-700',
    badge: 'text-amber-700 bg-white border-amber-200',
    ring: 'focus:ring-amber-500 bg-amber-100 border-amber-400 ring-2 ring-amber-400/40 shadow-sm',
  },
  blue: {
    card: 'bg-blue-50 border-blue-200 hover:bg-blue-100/70 hover:border-blue-300',
    label: 'text-blue-700',
    value: 'text-blue-700',
    badge: 'text-blue-700 bg-white border-blue-200',
    ring: 'focus:ring-blue-500 bg-blue-100 border-blue-400 ring-2 ring-blue-400/40 shadow-sm',
  },
  emerald: {
    card: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/70 hover:border-emerald-300',
    label: 'text-emerald-700',
    value: 'text-emerald-700',
    badge: 'text-emerald-700 bg-white border-emerald-200',
    ring: 'focus:ring-emerald-500 bg-emerald-100 border-emerald-400 ring-2 ring-emerald-400/40 shadow-sm',
  },
};

export function DoDSummaryCards({
  counters,
  severityFilter,
  remediationFilter,
  onSelectSeverity,
  onSelectRemediation,
  onResetAll,
}: DoDSummaryCardsProps) {
  const { t } = useTranslation(['reports', 'common']);

  const toggleSeverity = (target: string) => {
    onSelectSeverity(severityFilter === target ? 'ALL' : target);
  };

  const cards: CardConfig[] = [
    {
      key: 'ALL',
      titleKey: 'dodReport.summary.totalEvaluated',
      hintKey: 'dodReport.summary.filterHintAll',
      count: counters.total,
      theme: 'slate',
      active: severityFilter === 'ALL' && remediationFilter === 'ALL',
      onClick: onResetAll,
    },
    {
      key: 'Material Weakness',
      titleKey: 'dodReport.summary.materialWeakness',
      hintKey: 'dodReport.summary.filterHintMW',
      count: counters.mw,
      theme: 'red',
      active: severityFilter === 'Material Weakness',
      onClick: () => toggleSeverity('Material Weakness'),
    },
    {
      key: 'Significant Deficiency',
      titleKey: 'dodReport.summary.significantDeficiency',
      hintKey: 'dodReport.summary.filterHintSD',
      count: counters.sd,
      theme: 'amber',
      active: severityFilter === 'Significant Deficiency',
      onClick: () => toggleSeverity('Significant Deficiency'),
    },
    {
      key: 'Control Deficiency',
      titleKey: 'dodReport.summary.controlDeficiency',
      hintKey: 'dodReport.summary.filterHintCD',
      count: counters.cd,
      theme: 'blue',
      active: severityFilter === 'Control Deficiency',
      onClick: () => toggleSeverity('Control Deficiency'),
    },
    {
      key: 'REMEDIATED',
      titleKey: 'dodReport.summary.remediatedCount',
      hintKey: 'dodReport.summary.filterHintRemediated',
      count: counters.remediated,
      theme: 'emerald',
      active: remediationFilter === 'REMEDIATED',
      onClick: () =>
        onSelectRemediation(remediationFilter === 'REMEDIATED' ? 'ALL' : 'REMEDIATED'),
    },
  ];

  return (
    <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 print:grid-cols-5">
      {cards.map((card) => {
        const theme = THEME[card.theme];
        return (
          <button
            key={card.key}
            type="button"
            onClick={card.onClick}
            title={t(card.hintKey)}
            className={cn(
              'text-left p-3 rounded-lg border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2',
              card.active ? theme.ring : theme.card,
            )}
          >
            <div className={cn('text-xs font-semibold uppercase flex items-center justify-between flex-wrap gap-2', theme.label)}>
              <span>{t(card.titleKey)}</span>
              {card.active && (
                <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded border', theme.badge)}>
                  {t('dodReport.summary.activeFilter')}
                </span>
              )}
            </div>
            <div className={cn('text-lg font-bold mt-1', theme.value)}>{card.count}</div>
          </button>
        );
      })}
    </div>
  );
}
