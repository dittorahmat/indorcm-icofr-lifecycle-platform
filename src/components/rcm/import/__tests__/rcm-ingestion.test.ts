import { describe, expect, it } from 'vitest';
import {
  buildRcmImportPayload,
  importRcmFileText,
  linkRowToNode,
  requiresBpmReconciliation,
} from '../rcm-ingestion';
import type { BPMNodeOption } from '../rcm-import-types';

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
