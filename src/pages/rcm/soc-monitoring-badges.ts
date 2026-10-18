/**
 * Single owner for the SOCMonitoring badge decisions (SK-5/DKU.MBU/11/2024
 * Bab III.1.5 & 4.3 — significant applications and third-party SOC assurance).
 *
 * Before this module every status→tone decision existed twice: once in the
 * mobile card and once in the desktop table row. The copies had already
 * drifted (the card smuggled the `shrink-0` layout class into the tone string;
 * the SOC row carried a redundant `hover:bg-green-100`), so the next status
 * rename (`'Valid'` → anything) would have changed only one of the two views.
 *
 * The functions are pure and return a result: no `useQuery`, no dialog state,
 * no JSX, no React. Tone classes are layout-free — the view appends its own
 * layout classes (`shrink-0`, `gap-1`, …) through `SocBadge`.
 *
 * Not in the interface: the `<Badge>` element, the i18n `t()` call (the
 * returned `labelKey` is resolved by `SocBadge`), or which view renders which
 * badge. The deliberate view difference lives at the adapter: the desktop SOC
 * row shows the `Evaluation` column, the mobile card does not.
 */

/** The tone tokens every status badge shares. */
export type BadgeTone = 'positive' | 'negative' | 'neutral';

/** Shadcn Badge variant a spec resolves to. */
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

/**
 * i18n keys a spec may carry as data. A literal union so a typo is a `tsc`
 * error (CODING_STANDARDS §"Data-carried i18n keys ride on a literal union").
 */
export type SocBadgeLabelKey = 'common:yes' | 'common:no' | 'rcm:soc.itgc_not_tested';

export interface SocBadgeSpec {
  /** Display text: the status datum verbatim, or the fallback when `labelKey` is set. */
  label: string;
  /** i18n key when the label is fixed prose; `null` when `label` carries the datum. */
  labelKey: SocBadgeLabelKey | null;
  /** Tone classes only — the view appends layout classes. */
  className: string;
  /** Badge variant, so a tone can ride on the variant instead of classes. */
  variant: BadgeVariant;
}

/** The ONE tone→class table; every status badge below reads it. */
const TONE_CLASSNAME: Record<BadgeTone, string> = {
  positive: 'bg-green-100 text-green-700',
  negative: 'bg-red-100 text-red-700',
  neutral: 'bg-muted text-slate-500',
};

/**
 * `Effective` / `Ineffective` / anything-else tone for the ITGC columns
 * (Tabel 1 IT General Control status). A blank status reads as `Not Tested`.
 */
export function itgcStatusBadge(status?: string | null): SocBadgeSpec {
  const value = (status ?? '').trim();
  if (!value) {
    return {
      label: 'Not Tested',
      labelKey: 'rcm:soc.itgc_not_tested',
      className: TONE_CLASSNAME.neutral,
      variant: 'default',
    };
  }
  const tone: BadgeTone =
    value === 'Effective' ? 'positive' : value === 'Ineffective' ? 'negative' : 'neutral';
  return { label: value, labelKey: null, className: TONE_CLASSNAME[tone], variant: 'default' };
}

/**
 * The ICOFR scope flag (Y/N) of a significant application. Prose, so it rides
 * on the shared `common` bundle keys instead of a datum.
 */
export function significanceBadge(isSignificant: boolean): SocBadgeSpec {
  return isSignificant
    ? {
        label: 'Yes',
        labelKey: 'common:yes',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-xs',
        variant: 'outline',
      }
    : {
        label: 'No',
        labelKey: 'common:no',
        className: 'bg-slate-50 text-slate-500 border-slate-200 text-xs',
        variant: 'outline',
      };
}

/**
 * The SOC report validity: `Valid` is positively toned, everything else is
 * flagged red (the pre-existing behaviour — an unknown status is a finding,
 * not a neutral fact).
 */
export function socStatusBadge(status?: string | null): SocBadgeSpec {
  const value = (status ?? '').trim();
  const tone: BadgeTone = value === 'Valid' ? 'positive' : 'negative';
  return { label: value, labelKey: null, className: TONE_CLASSNAME[tone], variant: 'default' };
}

/** The application criticality badge; `High` is destructive-toned. */
export function criticalityBadge(criticality?: string | null): SocBadgeSpec {
  const value = (criticality ?? '').trim();
  return {
    label: value,
    labelKey: null,
    className: 'text-xs',
    variant: value === 'High' ? 'destructive' : 'default',
  };
}
