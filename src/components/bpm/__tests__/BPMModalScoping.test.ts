import { describe, it, expect } from 'vitest';
import { Control } from '@shared/types';

describe('BPM Modal Controls Strict Scoping Logic', () => {
  const sampleControls: Control[] = [
    {
      id: 'ctrl-1',
      code: 'CTL-REV-01',
      name: 'Verifikasi Penerimaan Penjualan',
      organizationId: 'org-1',
      bpmProcessId: 'proc-revenue',
      subProcess: 'Penerimaan Pendapatan',
      fsliCodes: ['4101'],
      year: 2026,
    } as any,
    {
      id: 'ctrl-2',
      code: 'CTL-REC-01',
      name: 'Rekonsiliasi Bank Harian',
      organizationId: 'org-1',
      bpmProcessId: 'proc-treasury',
      subProcess: 'Rekonsiliasi Kas & Bank',
      fsliCodes: ['1101'],
      year: 2026,
    } as any,
    {
      id: 'ctrl-3',
      code: 'CTL-PETTY-01',
      name: 'Pencatatan Kas Kecil',
      organizationId: 'org-1',
      bpmProcessId: 'proc-petty-cash',
      subProcess: 'Pengelolaan Kas Kecil',
      fsliCodes: ['1101'],
      year: 2026,
    } as any,
    {
      id: 'ctrl-orphan-diff-year',
      code: 'CTL-OLD-01',
      name: 'Kontrol Kas Tahun 2025',
      organizationId: 'org-1',
      bpmProcessId: 'proc-treasury',
      subProcess: 'Rekonsiliasi Kas & Bank',
      fsliCodes: ['1101'],
      year: 2025,
    } as any,
  ];

  function filterControls(
    controls: Control[],
    params: {
      noGL: string;
      bpmProcessId?: string;
      subProcessName?: string;
      year: string;
    }
  ) {
    return controls.filter(c => {
      // 1. Year check
      if (c.year && params.year && c.year.toString() !== params.year.toString()) {
        return false;
      }

      const cSub = (c.subProcess || '').toLowerCase().trim();
      const targetSub = (params.subProcessName || '').toLowerCase().trim();

      // Match 1: Hard ID link (Primary & Strict)
      if (params.bpmProcessId && c.bpmProcessId === params.bpmProcessId) {
        if (params.noGL && c.fsliCodes && c.fsliCodes.length > 0) {
          return c.fsliCodes.includes(params.noGL);
        }
        return true;
      }

      // Match 2: Name link (Secondary Fallback - MUST also match GL)
      if (targetSub && cSub === targetSub) {
        if (params.noGL && c.fsliCodes && c.fsliCodes.length > 0) {
          return c.fsliCodes.includes(params.noGL);
        }
        return !params.noGL;
      }

      return false;
    });
  }

  it('strictly isolates sub-processes sharing the same GL (no cross-bleeding between treasury & petty cash)', () => {
    // Open Modal for Treasury under GL 1101
    const treasuryResults = filterControls(sampleControls, {
      noGL: '1101',
      bpmProcessId: 'proc-treasury',
      subProcessName: 'Rekonsiliasi Kas & Bank',
      year: '2026',
    });

    expect(treasuryResults).toHaveLength(1);
    expect(treasuryResults[0].id).toBe('ctrl-2');

    // Open Modal for Petty Cash under GL 1101
    const pettyResults = filterControls(sampleControls, {
      noGL: '1101',
      bpmProcessId: 'proc-petty-cash',
      subProcessName: 'Pengelolaan Kas Kecil',
      year: '2026',
    });

    expect(pettyResults).toHaveLength(1);
    expect(pettyResults[0].id).toBe('ctrl-3');
  });

  it('rejects controls from different GL even if bpmProcessId matches', () => {
    const wrongGlResults = filterControls(sampleControls, {
      noGL: '9999', // Different GL
      bpmProcessId: 'proc-treasury',
      subProcessName: 'Rekonsiliasi Kas & Bank',
      year: '2026',
    });

    expect(wrongGlResults).toHaveLength(0);
  });

  it('rejects controls from past fiscal years', () => {
    const year2026Results = filterControls(sampleControls, {
      noGL: '1101',
      bpmProcessId: 'proc-treasury',
      subProcessName: 'Rekonsiliasi Kas & Bank',
      year: '2026',
    });

    const has2025Control = year2026Results.some(c => c.id === 'ctrl-orphan-diff-year');
    expect(has2025Control).toBe(false);
  });
});
