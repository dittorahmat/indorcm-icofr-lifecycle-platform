import React from 'react';
import { cn } from '@/lib/utils';

export interface BooleanIndicatorProps {
  value: boolean | string | null | undefined;
  truthyText?: string;
  falsyText?: string;
  tone?: 'default' | 'primary' | 'danger';
  className?: string;
}

/**
 * Standardized boolean compliance indicator for RCM and audit tables.
 * Renders consistent typography (font-mono text-xs), contrast, and weights.
 */
export const BooleanIndicator: React.FC<BooleanIndicatorProps> = ({
  value,
  truthyText = 'Y',
  falsyText = 'N',
  tone = 'default',
  className,
}) => {
  const isTruthy = value === true || value === 'Y' || value === 'true';

  let truthyColor = 'text-slate-800 font-semibold';
  if (tone === 'primary') {
    truthyColor = 'text-indigo-700 font-semibold';
  } else if (tone === 'danger') {
    truthyColor = 'text-rose-700 font-semibold';
  }

  return (
    <span
      className={cn(
        'font-mono text-xs select-none',
        isTruthy ? truthyColor : 'font-normal text-slate-400',
        className
      )}
    >
      {isTruthy ? truthyText : falsyText}
    </span>
  );
};
