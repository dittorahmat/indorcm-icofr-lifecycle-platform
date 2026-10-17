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

export type SeverityTone = 'mw' | 'sd' | 'cd';

export function getSeverityTone(sev: string): SeverityTone {
  if (sev === 'Material Weakness') return 'mw';
  if (sev === 'Significant Deficiency') return 'sd';
  return 'cd';
}

export function getSeverityMeta(sev: string): { label: string; className: string } {
  switch (getSeverityTone(sev)) {
    case 'mw':
      return {
        label: 'MW (Kelemahan Material)',
        className: 'bg-red-50 text-red-700 border-red-300 font-semibold text-xs rounded-md',
      };
    case 'sd':
      return {
        label: 'SD (Defisiensi Signifikan)',
        className: 'bg-amber-50 text-amber-700 border-amber-300 font-semibold text-xs rounded-md',
      };
    default:
      return {
        label: 'CD (Defisiensi Kontrol)',
        className: 'bg-slate-100 text-slate-700 border-slate-300 font-semibold text-xs rounded-md',
      };
  }
}

export function checkMark(v: boolean): string {
  return v ? '✓' : '-';
}
