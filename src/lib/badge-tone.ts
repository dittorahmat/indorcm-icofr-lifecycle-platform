/**
 * The tone, label and treatment vocabulary for deficiency severity and RCM risk
 * rating — one owner.
 *
 * "Tone" is which colour family a badge uses, independent of the surface it
 * sits on. Call sites ask for the tone and pick their own treatment where the
 * surfaces genuinely differ (outline fill, solid chip, dark-mode panel), but
 * they never re-derive the tone: a hand-written `=== 'High' ? … : low-colour`
 * silently collapses Medium into Low, which is what the testing card did before
 * this module existed.
 *
 * Labels are **keys**, never copy: the bundle owns the wording, so a locale
 * switch re-labels every surface and no severity string is hardcoded in a
 * component. The keys are the plain `reports` paths (no `ns:` prefix) because
 * the wording is shared by the reports screens and the deficiency board; a
 * consumer from another namespace passes `{ ns: 'reports' }` explicitly rather
 * than relying on a fallback lookup.
 *
 * Every table here is keyed by tone, so an unknown severity can no longer
 * produce `undefined` and crash a render (`severityConfig[severity].color` did
 * exactly that before this module owned the tables).
 */

export type SeverityTone = 'mw' | 'sd' | 'cd';

/** MW = Material Weakness, SD = Significant Deficiency, CD = Control Deficiency. */
export function severityTone(severity: string | undefined): SeverityTone {
  if (severity === 'Material Weakness') return 'mw';
  if (severity === 'Significant Deficiency') return 'sd';
  return 'cd';
}

/** Outline treatment shared by the DoD report tables and the findings screen. */
export const SEVERITY_TONE_CLASS: Record<SeverityTone, string> = {
  mw: 'bg-red-50 text-red-700 border-red-300 font-semibold text-xs rounded-md',
  sd: 'bg-amber-50 text-amber-700 border-amber-300 font-semibold text-xs rounded-md',
  cd: 'bg-slate-100 text-slate-700 border-slate-300 font-semibold text-xs rounded-md',
};

/** Filled chip, used where the severity is the headline (the board card). */
export const SEVERITY_SOLID_CLASS: Record<SeverityTone, string> = {
  mw: 'bg-rose-500 text-white',
  sd: 'bg-amber-500 text-white',
  cd: 'bg-blue-500 text-white',
};

/** Dark-mode-capable panel, used by the DoD conclusion footer. */
export const SEVERITY_PANEL_CLASS: Record<SeverityTone, string> = {
  mw: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300',
  sd: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300',
  cd: 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300',
};

/** The long form the DoD report and the conclusion footer print. */
export type SeverityLabelKey =
  | 'dodReport.summary.materialWeakness'
  | 'dodReport.summary.significantDeficiency'
  | 'dodReport.summary.controlDeficiency';

const SEVERITY_LABEL_KEY: Record<SeverityTone, SeverityLabelKey> = {
  mw: 'dodReport.summary.materialWeakness',
  sd: 'dodReport.summary.significantDeficiency',
  cd: 'dodReport.summary.controlDeficiency',
};

export function severityLabelKey(severity: string | undefined): SeverityLabelKey {
  return SEVERITY_LABEL_KEY[severityTone(severity)];
}

/** The compact form for a narrow badge column — a key too, not an abbreviation. */
export type SeverityShortLabelKey =
  | 'dodReport.severityShort.mw'
  | 'dodReport.severityShort.sd'
  | 'dodReport.severityShort.cd';

const SEVERITY_SHORT_LABEL_KEY: Record<SeverityTone, SeverityShortLabelKey> = {
  mw: 'dodReport.severityShort.mw',
  sd: 'dodReport.severityShort.sd',
  cd: 'dodReport.severityShort.cd',
};

export function severityShortLabelKey(severity: string | undefined): SeverityShortLabelKey {
  return SEVERITY_SHORT_LABEL_KEY[severityTone(severity)];
}

export type RiskRatingTone = 'high' | 'medium' | 'low';

/** Risk Library ratings arrive as Low/Medium/High; anything else reads as Low. */
export function riskRatingTone(rating: string | undefined): RiskRatingTone {
  if (rating === 'High') return 'high';
  if (rating === 'Medium') return 'medium';
  return 'low';
}

/** Outline treatment for the RCM risk-rating badges (RCM table + TLC tabs). */
export const RISK_RATING_TONE_CLASS: Record<RiskRatingTone, string> = {
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};
