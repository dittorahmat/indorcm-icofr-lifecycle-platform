import { Globe, Plus, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

const ACTION_CLASS = 'gap-2 w-full sm:w-auto h-11 sm:h-10 min-h-[44px] justify-center';

interface SocMonitoringHeaderActionsProps {
  onAddVendor: () => void;
  onRegisterSoc: () => void;
  onAddApplication: () => void;
}

/**
 * The three header CTAs, config-driven because the block repeated three times
 * (AGENTS.md §"blok JSX yang diduplikasi ≥3× wajib config-driven").
 */
export function SocMonitoringHeaderActions({
  onAddVendor,
  onRegisterSoc,
  onAddApplication,
}: SocMonitoringHeaderActionsProps) {
  const { t } = useTranslation('rcm');
  const actions = [
    {
      id: 'vendor',
      icon: Globe,
      label: t('rcm:soc.action.add_vendor', { defaultValue: 'Add Vendor' }),
      variant: 'outline' as const,
      className: `bg-white ${ACTION_CLASS}`,
      onOpen: onAddVendor,
    },
    {
      id: 'soc',
      icon: ShieldCheck,
      label: t('rcm:soc.action.register_soc', { defaultValue: 'Register SOC' }),
      variant: 'outline' as const,
      className: `bg-white ${ACTION_CLASS}`,
      onOpen: onRegisterSoc,
    },
    {
      id: 'app',
      icon: Plus,
      label: t('rcm:soc.action.add_application', { defaultValue: 'Add Application' }),
      variant: 'default' as const,
      className: `bg-indigo-600 hover:bg-indigo-700 shadow-lg ${ACTION_CLASS}`,
      onOpen: onAddApplication,
    },
  ];

  return (
    <>
      {actions.map((action) => (
        <Button key={action.id} variant={action.variant} className={action.className} onClick={action.onOpen}>
          <action.icon className="h-4 w-4" />
          {action.label}
        </Button>
      ))}
    </>
  );
}
