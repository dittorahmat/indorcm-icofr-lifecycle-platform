export function formatIDR(val: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
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
