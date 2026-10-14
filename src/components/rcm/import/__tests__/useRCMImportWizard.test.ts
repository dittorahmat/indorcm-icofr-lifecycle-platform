import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { strictT } from '@/test/mock-i18n';
import { useRCMImportWizard } from '../useRCMImportWizard';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: strictT,
  }),
}));

const baseParams = {
  workingYear: '2025',
  onClose: () => {},
} as const;

describe('useRCMImportWizard initialFlavor preset', () => {
  it('defaults to TLC when no preset is given', () => {
    const { result } = renderHook(() => useRCMImportWizard({ ...baseParams }));
    expect(result.current.flavor).toBe('TLC');
  });

  it('starts with the ELC preset from the ELC matrix page', () => {
    const { result } = renderHook(() =>
      useRCMImportWizard({ ...baseParams, initialFlavor: 'ELC' }),
    );
    expect(result.current.flavor).toBe('ELC');
  });

  it('starts with the ITGC preset from the ITGC matrix page', () => {
    const { result } = renderHook(() =>
      useRCMImportWizard({ ...baseParams, initialFlavor: 'ITGC' }),
    );
    expect(result.current.flavor).toBe('ITGC');
  });

  it('still allows switching flavor inside the wizard', () => {
    const { result } = renderHook(() =>
      useRCMImportWizard({ ...baseParams, initialFlavor: 'ELC' }),
    );
    act(() => {
      result.current.setFlavor('ITGC');
    });
    expect(result.current.flavor).toBe('ITGC');
  });

  it('resyncs when the preset changes', () => {
    const { result, rerender } = renderHook(
      ({ preset }: { preset: 'ELC' | 'ITGC' }) =>
        useRCMImportWizard({ ...baseParams, initialFlavor: preset }),
      { initialProps: { preset: 'ELC' as const } },
    );
    expect(result.current.flavor).toBe('ELC');
    rerender({ preset: 'ITGC' });
    expect(result.current.flavor).toBe('ITGC');
  });
});
