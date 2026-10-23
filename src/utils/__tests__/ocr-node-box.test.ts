import { describe, expect, it } from 'vitest';

import { estimateNodeBox } from '../ocr-node-box';

describe('estimateNodeBox', () => {
  it('keeps the registry height for a short single-line label', () => {
    expect(estimateNodeBox('activity', 'Input')).toEqual({ width: 160, height: 56 });
  });

  it('grows tall enough for the wrapped KUR approval label', () => {
    const box = estimateNodeBox('activity', 'MEMBUAT PERTIMBANGAN DAN PERSETUJUAN');
    expect(box.height).toBeGreaterThanOrEqual(90);
    expect(box.width).toBe(160);
  });

  it('adds one line of height per wrapped line', () => {
    const oneLine = estimateNodeBox('activity', 'KEPUTUSAN').height;
    const twoLines = estimateNodeBox('activity', 'MENERIMA USULAN KREDIT KONSUMEN').height;
    expect(twoLines).toBeGreaterThan(oneLine);
  });

  it('keeps fixed-height types at their registry size regardless of label length', () => {
    expect(estimateNodeBox('document', 'SURAT PERSETUJUAN KREDIT YANG SANGAT PANJANG SEKALI')).toEqual({
      width: 130,
      height: 48,
    });
    expect(estimateNodeBox('decision', 'MEMENUHI SYARAT DAN KETENTUAN YANG BERLAKU')).toEqual({
      width: 110,
      height: 110,
    });
  });

  it('is deterministic for identical input', () => {
    const first = estimateNodeBox('external-process', 'VERIFIKASI BI CHECKING DAN SLIK OJK');
    const second = estimateNodeBox('external-process', 'VERIFIKASI BI CHECKING DAN SLIK OJK');
    expect(second).toEqual(first);
  });
});
