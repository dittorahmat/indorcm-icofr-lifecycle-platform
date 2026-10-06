import { describe, it, expect } from 'vitest';
import { RCM_TEMPLATE_CSV, templateFilename } from '../import-templates';

describe('import-templates', () => {
  it('provides a semicolon-delimited header per RCM type', () => {
    expect(RCM_TEMPLATE_CSV.TLC).toContain('No;Informasi_Proses_Bisnis');
    expect(RCM_TEMPLATE_CSV.TLC).toContain('Asersi_PD');
    expect(RCM_TEMPLATE_CSV.ELC).toContain('Prinsip_COSO');
    expect(RCM_TEMPLATE_CSV.ITGC).toContain('Frekuensi_Pelaksanaan_Aktivitas');
  });

  it('builds a type-specific template filename', () => {
    expect(templateFilename('TLC')).toBe('Template_RCM_TLC.csv');
    expect(templateFilename('ELC')).toBe('Template_RCM_ELC.csv');
    expect(templateFilename('ITGC')).toBe('Template_RCM_ITGC.csv');
  });
});
