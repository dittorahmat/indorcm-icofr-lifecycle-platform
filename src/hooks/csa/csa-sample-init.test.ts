import { describe, it, expect } from 'vitest';
import { createDefaultSampleControlResults, type ControlOptionLike } from './csa-sample-init';
import type { RiskControlPair } from '@/components/bpm/csa/csa-form-types';

describe('csa-sample-init', () => {
  const mockControls: ControlOptionLike[] = [
    {
      id: 'ctrl-1',
      code: 'C-01',
      name: 'Persetujuan Kredit',
      description: 'Persetujuan oleh pemutus',
    },
    {
      id: 'ctrl-2',
      code: 'C-02',
      name: 'Verifikasi Identitas',
      description: 'Verifikasi KTP debitur',
    },
  ];

  const mockPairs: RiskControlPair[] = [
    {
      controlId: 'ctrl-1',
      riskId: 'risk-1',
      riskName: 'Penyalahgunaan Wewenang',
      controlName: 'Persetujuan Kredit',
    },
  ];

  it('initializes control results using bpmRiskControlPairs when available', () => {
    const results = createDefaultSampleControlResults({
      activeControls: mockControls,
      bpmRiskControlPairs: mockPairs,
    });

    expect(results['ctrl-1']).toBeDefined();
    expect(results['ctrl-1']?.implemented).toBe(true);
    expect(results['ctrl-1']?.riskId).toBe('risk-1');
    expect(results['ctrl-1']?.riskName).toBe('Penyalahgunaan Wewenang');
    expect(results['ctrl-2']).toBeUndefined();
  });

  it('falls back to activeControls when bpmRiskControlPairs is empty', () => {
    const results = createDefaultSampleControlResults({
      activeControls: mockControls,
      bpmRiskControlPairs: [],
    });

    expect(results['ctrl-1']?.implemented).toBe(true);
    expect(results['ctrl-2']?.implemented).toBe(true);
    expect(results['ctrl-2']?.controlName).toBe('Verifikasi Identitas');
  });

  it('respects defaultImplemented override if explicitly passed', () => {
    const results = createDefaultSampleControlResults({
      activeControls: mockControls,
      defaultImplemented: false,
    });

    expect(results['ctrl-1']?.implemented).toBe(false);
  });
});
