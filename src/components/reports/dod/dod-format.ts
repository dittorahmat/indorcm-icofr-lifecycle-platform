/**
 * Single owner for Indonesian rupiah rendering across the client.
 *
 * Contract (every money call site imports these two functions — a second
 * `Intl.NumberFormat`/`toLocaleString` for currency is a defect):
 * - Locale is ALWAYS `id-ID`, never the ambient browser locale: grouping is the
 *   Indonesian dot (`1.234.567`), never US commas.
 * - `formatIDR` — currency shape: `Rp 1.234.567`, `maximumFractionDigits: 0`
 *   (rupiah sen are rounded away, never shown as `,00`). The symbol is followed
 *   by ICU's NBSP (U+00A0), which renders as a space but does not line-break.
 * - `formatIDRPlain` — symbol-less shape for cells/notes that already carry the
 *   `Rp`/`Consolidated` label. It deliberately keeps ICU's `id-ID` default of up
 *   to 3 fraction digits, exactly as the hand-rolled `id-ID` grouping it replaces,
 *   so raw GL balances are not silently rounded.
 * - `null` / `undefined` / non-finite (`NaN`, `±Infinity`) → `'-'`, never `Rp NaN`.
 * - Negatives keep the ICU shape: `-1234` → `-Rp 1.234`.
 */
import { SEVERITY_TONE_CLASS, severityLabelKey, severityTone } from '@/lib/badge-tone';

const IDR_CURRENCY_FORMAT = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const IDR_GROUPED_FORMAT = new Intl.NumberFormat('id-ID');

export function formatIDR(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? IDR_CURRENCY_FORMAT.format(value) : '-';
}

export function formatIDRPlain(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? IDR_GROUPED_FORMAT.format(value) : '-';
}

/**
 * Tone and badge class come from the single owner in `@/lib/badge-tone`, and the
 * label travels as an i18n KEY — this module used to hold a hardcoded Indonesian
 * label table (`'MW (Kelemahan Material)'`), which also disagreed with the
 * order the DoD cards and filters print (`'Kelemahan Material (MW)'` from the
 * bundle).
 */
export function getSeverityMeta(sev: string): { labelKey: string; className: string } {
  return { labelKey: severityLabelKey(sev), className: SEVERITY_TONE_CLASS[severityTone(sev)] };
}

export function checkMark(v: boolean): string {
  return v ? '✓' : '-';
}
