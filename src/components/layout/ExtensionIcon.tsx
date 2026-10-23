import { HelpCircle, type LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

/**
 * Every Lucide component the extension manifests may name, resolved once.
 * Keeping this at module scope means an unknown name costs one lookup, not a
 * render-time module scan.
 */
const LUCIDE_ICONS: Record<string, LucideIcon> = Object.fromEntries(
  Object.entries(LucideIcons).filter(
    // Icon exports are PascalCase; helpers in the module are camelCase.
    (entry): entry is [string, LucideIcon] => /^[A-Z]/.test(entry[0]),
  ),
);

/**
 * boundary: extension manifests carry a Lucide icon name as plain text.
 * This is the single resolver; an unknown name falls back to `HelpCircle`
 * instead of crashing the sidebar. Locked by its own test.
 */
export function ExtensionIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = LUCIDE_ICONS[name] ?? HelpCircle;
  return <IconComponent className={className} />;
}
