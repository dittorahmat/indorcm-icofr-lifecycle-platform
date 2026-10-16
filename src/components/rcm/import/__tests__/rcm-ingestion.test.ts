import { describe, expect, it } from 'vitest';
import {
  buildRcmImportPayload,
  buildRcmTemplateCsv,
  importRcmFileText,
  linkRowToNode,
  RCM_MATCH_AUTO_THRESHOLD,
  RCM_MATCH_SUGGEST_THRESHOLD,
  requiresBpmReconciliation,
  summarizeRcmRows,
} from '../rcm-ingestion';
import type { BPMNodeOption, RCMFlavor } from '../rcm-import-types';

const NODES: BPMNodeOption[] = [
  { id: 'node-1', label: '1.1 Penerimaan Kas Teller', type: 'activity' },
  { id: 'node-2', label: '1.2 Verifikasi Setoran', type: 'activity' },
];

const TLC_CSV = [
  'proses_bisnis,sub_proses,ref_langkah_bpm,risiko,nama_aktivitas_pengendalian',
  'Setoran,Setoran Teller,1.2,Risiko selisih kas,Verifikasi Setoran',
  'Setoran,Setoran Teller,,Risiko uang palsu,Uji Keaslian Uang',
].join('\n');

describe('rcm-ingestion seam (parse + reconcile behind one interface)', () => {
  it('parses TLC rows and reconciles Ref matches in one call', () => {
    const { rows, errors } = importRcmFileText(TLC_CSV, 'TLC', NODES);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(2);
    expect(rows[0].matchStatus).toBe('matched');
    expect(rows[0].targetBpmNodeId).toBe('node-2');
    expect(rows[0].isValid).toBe(true);
  });

  it('leaves rows unmatched when no BPM nodes are known', () => {
    const { rows } = importRcmFileText(TLC_CSV, 'TLC', []);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.matchStatus === 'unmatched')).toBe(true);
  });

  it('skips the risk requirement for ELC flavor', () => {
    const csv = [
      'proses_bisnis,sub_proses,nama_aktivitas_pengendalian,prinsip_coso',
      'Tata Kelola,Pengawasan,Lingkungan Pengendalian Aktif,1',
    ].join('\n');
    const { rows } = importRcmFileText(csv, 'ELC', []);
    expect(rows).toHaveLength(1);
    expect(rows[0].isValid).toBe(true);
    expect(rows[0].cosoPrinciples).toEqual([1]);
  });

  it('requires risk descriptions for TLC flavor', () => {
    const csv = [
      'proses_bisnis,sub_proses,nama_aktivitas_pengendalian',
      'Setoran,Setoran Teller,Verifikasi Setoran',
    ].join('\n');
    const { rows } = importRcmFileText(csv, 'TLC', []);
    expect(rows).toHaveLength(1);
    expect(rows[0].isValid).toBe(false);
    expect(rows[0].validationErrors).toContain('Deskripsi risiko wajib diisi');
  });

  it('reports empty files without rows', () => {
    const { rows, errors } = importRcmFileText('proses_bisnis,risiko', 'TLC', NODES);
    expect(rows).toEqual([]);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('stages match stats, invalid counts and proceed gating in one result', () => {
    const staged = importRcmFileText(TLC_CSV, 'TLC', NODES);
    expect(staged.matchStats).toEqual({ matched: 1, suggested: 0, unmatched: 1 });
    expect(staged.invalidRowCount).toBe(0);
    expect(staged.canProceed).toBe(true);

    const empty = importRcmFileText('proses_bisnis,risiko', 'TLC', NODES);
    expect(empty.canProceed).toBe(false);
    expect(empty.matchStats).toEqual({ matched: 0, suggested: 0, unmatched: 0 });
  });

  it('honors the key-control column instead of defaulting everything to key', () => {
    const csv = [
      'proses_bisnis,sub_proses,risiko,nama_aktivitas_pengendalian,pengendalian_utama',
      'Setoran,Setoran Teller,Risiko A,Kontrol Kunci,ya',
      'Setoran,Setoran Teller,Risiko B,Kontrol Biasa,tidak',
    ].join('\n');
    const { rows } = importRcmFileText(csv, 'TLC', []);
    expect(rows[0].isKeyControl).toBe(true);
    expect(rows[1].isKeyControl).toBe(false);
  });

  it('linkRowToNode owns the manual link status transition', () => {
    const { rows } = importRcmFileText(TLC_CSV, 'TLC', NODES);
    const linked = linkRowToNode(rows, 'row-2', 'node-1');
    expect(linked.find((r) => r.id === 'row-2')).toMatchObject({
      targetBpmNodeId: 'node-1',
      matchStatus: 'matched',
    });
    expect(linked.find((r) => r.id === 'row-1')?.targetBpmNodeId).toBe('node-2');

    const unlinked = linkRowToNode(linked, 'row-2', undefined);
    expect(unlinked.find((r) => r.id === 'row-2')).toMatchObject({
      targetBpmNodeId: undefined,
      matchStatus: 'unmatched',
    });
  });

  it('buildRcmImportPayload shapes the commit body in one place', () => {
    const { rows } = importRcmFileText(TLC_CSV, 'TLC', NODES);
    expect(
      buildRcmImportPayload({
        flavor: 'TLC',
        workingYear: '2025',
        bpmProcessId: 'bpm-1',
        diagramId: 'diag-1',
        rows,
      }),
    ).toEqual({
      rcmType: 'TLC',
      year: '2025',
      bpmProcessId: 'bpm-1',
      diagramId: 'diag-1',
      rows,
    });
  });

  it('requiresBpmReconciliation locks the ELC-vs-TLC step-3 gate', () => {
    expect(requiresBpmReconciliation('TLC')).toBe(true);
    expect(requiresBpmReconciliation('ELC')).toBe(false);
    expect(requiresBpmReconciliation('ITGC')).toBe(false);
  });
});

describe('rcm-ingestion CONTRACT (template → parse → reconcile through the seam)', () => {
  const alignedNodes: Record<RCMFlavor, BPMNodeOption[]> = {
    TLC: [{ id: '1.2', label: '1.2 Verifikasi Vendor Due Diligence', type: 'activity' }],
    ELC: [{ id: 'elc-1', label: 'Sosialisasi Pakta Integritas Tahunan', type: 'activity' }],
    ITGC: [{ id: 'itgc-1', label: 'Review Hak Akses Pengguna Triwulanan', type: 'activity' }],
  };

  for (const flavor of ['TLC', 'ELC', 'ITGC'] as const) {
    it(`${flavor} template sample parses with zero unmatched on aligned nodes`, () => {
      const staged = importRcmFileText(buildRcmTemplateCsv(flavor), flavor, alignedNodes[flavor]);
      expect(staged.errors).toEqual([]);
      expect(staged.rows).toHaveLength(1);
      expect(staged.rows[0].matchStatus).toBe('matched');
      expect(staged.matchStats).toEqual({ matched: 1, suggested: 0, unmatched: 0 });
      expect(staged.invalidRowCount).toBe(0);
      expect(staged.canProceed).toBe(true);
    });
  }

  it('exports the documented token-overlap threshold values', () => {
    expect(RCM_MATCH_SUGGEST_THRESHOLD).toBe(0.25);
    expect(RCM_MATCH_AUTO_THRESHOLD).toBe(0.6);
  });

  const csvWithControls = (controlNames: string[]): string =>
    [
      'proses_bisnis,sub_proses,risiko,nama_aktivitas_pengendalian',
      ...controlNames.map((c) => `Setoran,Setoran Teller,Risiko umum,${c}`),
    ].join('\n');

  it('marks overlap exactly at the suggest threshold (1/4 = 0.25) as suggested', () => {
    const nodes: BPMNodeOption[] = [{ id: 'n4', label: 'Alpha Beta Gamma Delta', type: 'activity' }];
    const staged = importRcmFileText(csvWithControls(['Alpha']), 'TLC', nodes);
    expect(staged.rows[0].matchStatus).toBe('suggested');
  });

  it('leaves overlap below the suggest threshold (1/5 = 0.2) unmatched', () => {
    const nodes: BPMNodeOption[] = [
      { id: 'n5', label: 'Alpha Beta Gamma Delta Epsilon', type: 'activity' },
    ];
    const staged = importRcmFileText(csvWithControls(['Alpha']), 'TLC', nodes);
    expect(staged.rows[0].matchStatus).toBe('unmatched');
  });

  it('marks overlap exactly at the auto threshold (3/5 = 0.6) as matched', () => {
    const nodes: BPMNodeOption[] = [
      { id: 'n5', label: 'Alpha Beta Gamma Delta Epsilon', type: 'activity' },
    ];
    const staged = importRcmFileText(csvWithControls(['Alpha Beta Gamma']), 'TLC', nodes);
    expect(staged.rows[0].matchStatus).toBe('matched');
  });

  it('marks overlap below the auto threshold (2/5 = 0.4) as suggested', () => {
    const nodes: BPMNodeOption[] = [
      { id: 'n5', label: 'Alpha Beta Gamma Delta Epsilon', type: 'activity' },
    ];
    const staged = importRcmFileText(csvWithControls(['Alpha Beta']), 'TLC', nodes);
    expect(staged.rows[0].matchStatus).toBe('suggested');
  });

  it('gates step-3 reconciliation to TLC while ELC/ITGC skip it', () => {
    expect(requiresBpmReconciliation('TLC')).toBe(true);
    expect(requiresBpmReconciliation('ELC')).toBe(false);
    expect(requiresBpmReconciliation('ITGC')).toBe(false);
  });

  it('lets ELC/ITGC proceed to commit with no BPM nodes staged', () => {
    const elc = importRcmFileText(buildRcmTemplateCsv('ELC'), 'ELC', []);
    const itgc = importRcmFileText(buildRcmTemplateCsv('ITGC'), 'ITGC', []);
    expect(elc.canProceed).toBe(true);
    expect(elc.invalidRowCount).toBe(0);
    expect(itgc.canProceed).toBe(true);
    expect(itgc.invalidRowCount).toBe(0);
  });

  it('summarizeRcmRows mirrors staged counts for step-view adapters', () => {
    const staged = importRcmFileText(TLC_CSV, 'TLC', NODES);
    expect(summarizeRcmRows(staged.rows)).toEqual({
      matchStats: staged.matchStats,
      invalidRowCount: staged.invalidRowCount,
      canProceed: true,
    });
    expect(summarizeRcmRows([])).toEqual({
      matchStats: { matched: 0, suggested: 0, unmatched: 0 },
      invalidRowCount: 0,
      canProceed: false,
    });
  });
});
