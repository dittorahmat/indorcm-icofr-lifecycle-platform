import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';

interface SettingsFieldProps {
  /** Caption text, already translated by the caller. */
  label: string;
  /** Id of the control this caption names (programmatic label association). */
  controlId: string;
  hint?: string;
  children: ReactNode;
}

/**
 * One labelled settings control: caption + control + optional hint. Single column
 * at every width (the parent grid handles the multi-column breakpoints), so the
 * caption never squeezes the control inside a 320px card.
 */
export function SettingsField({ label, controlId, hint, children }: SettingsFieldProps) {
  return (
    <div className="space-y-2 min-w-0">
      <Label
        htmlFor={controlId}
        className="text-xs font-black uppercase text-slate-500 tracking-wider"
      >
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
