import { describe, it, expect } from 'vitest';
import { reconcileRcmWithBpmNodes } from '../rcm-reconciliation-matcher';
import type { BPMNodeOption, RCMImportParsedRow } from '../rcm-import-types';

describe('reconcileRcmWithBpmNodes', () => {
  const mockBpmNodes: BPMNodeOption[] = [
    { id: 'node-1', label: '1.1 Pembuatan Permintaan Pembelian (PR)', type: 'activity' },
    { id: 'node-2', label: '1.2 Verifikasi Vendor Due Diligence', type: 'activity' },
    { id: 'node-3', label: '1.3 Persetujuan Purchase Order (PO)', type: 'activity' },
  ];

  it('matches exactly by bpmNodeRef prefix', () => {
    const rows: RCMImportParsedRow[] = [
      {
        id: 'row-1',
        processName: 'Procure-to-Pay',
        subProcessName: 'Pengadaan',
        bpmNodeRef: '1.2',
        riskDescription: 'Risiko vendor fiktif',
        controlName: 'Uji Tuntas Rekanan',
      },
    ];

    const result = reconcileRcmWithBpmNodes(rows, mockBpmNodes);
    expect(result[0].matchStatus).toBe('matched');
    expect(result[0].targetBpmNodeId).toBe('node-2');
  });

  it('matches matched via high token similarity when bpmNodeRef is missing', () => {
    const rows: RCMImportParsedRow[] = [
      {
        id: 'row-2',
        processName: 'Procure-to-Pay',
        subProcessName: 'Pengadaan',
        riskDescription: 'Risiko PO tidak sah',
        controlName: 'Persetujuan Purchase Order Manager',
      },
    ];

    const result = reconcileRcmWithBpmNodes(rows, mockBpmNodes);
    expect(result[0].matchStatus).toBe('matched');
    expect(result[0].targetBpmNodeId).toBe('node-3');
  });

  it('matches suggested via partial token similarity', () => {
    const rows: RCMImportParsedRow[] = [
      {
        id: 'row-2b',
        processName: 'Procure-to-Pay',
        subProcessName: 'Pengadaan',
        riskDescription: 'Risiko umum pengadaan',
        controlName: 'Verifikasi Tim Pengadaan Barang',
        controlDescription: 'Prosedur operasional standar kepatuhan administrasi',
      },
    ];

    const result = reconcileRcmWithBpmNodes(rows, mockBpmNodes);
    expect(result[0].matchStatus).toBe('suggested');
    expect(result[0].targetBpmNodeId).toBe('node-2');
  });

  it('returns unmatched when no tokens or refs correlate', () => {
    const rows: RCMImportParsedRow[] = [
      {
        id: 'row-3',
        processName: 'Record-to-Report',
        subProcessName: 'Penyusunan Neraca',
        riskDescription: 'Risiko salah saji jurnal',
        controlName: 'Rekonsiliasi Bank Harian',
      },
    ];

    const result = reconcileRcmWithBpmNodes(rows, mockBpmNodes);
    expect(result[0].matchStatus).toBe('unmatched');
    expect(result[0].targetBpmNodeId).toBeUndefined();
  });
});
