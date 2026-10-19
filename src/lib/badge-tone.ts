/**
 * The tone vocabulary for deficiency severity and RCM risk rating — one owner.
 *
 * "Tone" is which colour family a badge uses, independent of the surface it
 * sits on. Call sites ask for the tone and pick their own treatment where the
 * surfaces genuinely differ (outline fill, text-only, solid), but they never
 * re-derive the tone: a hand-written `=== 'High' ? … : low-colour` silently
 * collapses Medium into Low, which is what the testing card did before this
 * module existed.
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
