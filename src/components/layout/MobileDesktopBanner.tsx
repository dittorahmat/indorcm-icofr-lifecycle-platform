import { MonitorSmartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MobileDesktopBannerProps {
  recordCount?: number;
}

/**
 * Mobile-only read-only notice for wide desktop tables.
 * Rendered above heavy grids (BPM worksheet, scoping, regulatory reports)
 * on viewports below `md` so field users get an honest expectation:
 * read here, edit on desktop. Hidden on desktop and in print.
 */
export function MobileDesktopBanner({ recordCount }: MobileDesktopBannerProps) {
  const { t } = useTranslation('common');

  return (
    <div
      role="note"
      data-testid="mobile-desktop-banner"
      className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-sm md:hidden print:hidden"
    >
      <MonitorSmartphone className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs font-bold text-foreground">
          {t('mobile.desktopBanner.title', { defaultValue: 'Tampilan baca di HP' })}
          {typeof recordCount === 'number' ? ` · ${recordCount}` : ''}
        </p>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
          {t('mobile.desktopBanner.description', {
            defaultValue: 'Tabel lengkap membutuhkan layar lebar. Buka di desktop untuk mengedit data ini.',
          })}
        </p>
      </div>
    </div>
  );
}
