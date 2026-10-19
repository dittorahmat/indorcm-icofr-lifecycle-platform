import { describe, expect, it } from 'vitest';
import { toWorksheetRow, toWorksheetRows, type WorksheetRowSource } from './worksheet-row';

/** The columns `controls` actually stores — the row shape normalizes them. */
const base: WorksheetRowSource = {
  id: 'c1',
  code: 'FIN-01',
  businessProcess: 'Penerimaan Kas',
  subProcess: 'Penerimaan Setoran',
  name: 'Verifikasi Bukti Setoran',
  location: 'Kantor Pusat',
  description: 'Cek kelengkapan dokumen setoran',
  isFraudRelated: true,
  reference: 'SOP-KAS-01',
  relatedControlIds: ['elc-1', 'elc-2'],
  supportingDocs: 'bukti-setoran.pdf',
  isKeyControl: true,
  ipos: ['Completeness', 'Accuracy'],
  assertions: ['Accuracy', 'Completeness'],
  type: 'Preventive',
  nature: 'Manual',
  applicationId: 'app-1',
};

describe('toWorksheetRow', () => {
  it('carries the row fields both renderers read', () => {
    expect(toWorksheetRow(base)).toEqual({
      id: 'c1',
      code: 'FIN-01',
      businessProcess: 'Penerimaan Kas',
      subProcess: 'Penerimaan Setoran',
      name: 'Verifikasi Bukti Setoran',
      location: 'Kantor Pusat',
      description: 'Cek kelengkapan dokumen setoran',
      isFraudRelated: true,
      reference: 'SOP-KAS-01',
      relatedControlIds: ['elc-1', 'elc-2'],
      supportingDocs: 'bukti-setoran.pdf',
      isKeyControl: true,
      ipos: ['Completeness', 'Accuracy'],
      assertions: ['Accuracy', 'Completeness'],
      type: 'Preventive',
      nature: 'Manual',
      applicationId: 'app-1',
    });
  });

  it('normalizes null text columns to empty strings', () => {
    const row = toWorksheetRow({
      ...base,
      businessProcess: null,
      subProcess: null,
      location: null,
      description: null,
      reference: null,
      supportingDocs: null,
    });
    expect(row.businessProcess).toBe('');
    expect(row.subProcess).toBe('');
    expect(row.location).toBe('');
    expect(row.description).toBe('');
    expect(row.reference).toBe('');
    expect(row.supportingDocs).toBe('');
  });

  it('treats only literal true as a checked flag', () => {
    // The DB defaults are `false`, but a row arriving from an older API may omit
    // them — the card must not render the "key control" badge for those.
    const row = toWorksheetRow({ ...base, isKeyControl: null, isFraudRelated: null });
    expect(row.isKeyControl).toBe(false);
    expect(row.isFraudRelated).toBe(false);
  });

  it('keeps an unset application and unset type/nature as-is', () => {
    const row = toWorksheetRow({ ...base, applicationId: null, type: null, nature: null });
    expect(row.applicationId).toBeNull();
    expect(row.type).toBeNull();
    expect(row.nature).toBeNull();
  });

  it('passes empty lists through as empty lists', () => {
    const row = toWorksheetRow({ ...base, ipos: [], assertions: [], relatedControlIds: [] });
    expect(row.ipos).toEqual([]);
    expect(row.assertions).toEqual([]);
    expect(row.relatedControlIds).toEqual([]);
  });
});

describe('toWorksheetRows', () => {
  it('maps every control in order', () => {
    const rows = toWorksheetRows([base, { ...base, id: 'c2', code: 'FIN-02' }]);
    expect(rows.map((row) => row.id)).toEqual(['c1', 'c2']);
    expect(rows.map((row) => row.code)).toEqual(['FIN-01', 'FIN-02']);
  });

  it('returns an empty list for no controls', () => {
    expect(toWorksheetRows([])).toEqual([]);
  });
});
