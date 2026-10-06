import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type ActionTone = 'indigo' | 'emerald';

const TONE_CLASS: Record<ActionTone, string> = {
  indigo: 'text-indigo-600 hover:bg-indigo-100/60',
  emerald: 'text-emerald-600 hover:bg-emerald-50',
};

interface DiagramActionButtonProps {
  icon: React.ReactNode;
  tooltipKey: string;
  fallback: string;
  tone: ActionTone;
  onClick: () => void;
}

export function DiagramActionButton({ icon, tooltipKey, fallback, tone, onClick }: DiagramActionButtonProps) {
  const { t } = useTranslation(['bpm', 'common']);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-11 w-11 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 ${TONE_CLASS[tone]} rounded-xl transition-all shrink-0`}
            onClick={onClick}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-mancity-pattern text-primary-foreground border-none rounded-lg text-xs font-bold uppercase tracking-widest px-3 py-1.5 shadow-xl">
          {t(tooltipKey, fallback)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
