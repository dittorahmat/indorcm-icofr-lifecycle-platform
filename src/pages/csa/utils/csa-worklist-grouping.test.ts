import { describe, expect, it } from 'vitest';
import { classifyWorklistEmpty, groupWorklistByProcess } from './csa-worklist-grouping';

describe('csa-worklist-grouping seam (grup BPM + empty-state)', () => {
  it('groups items by BPM in order of first appearance', () => {
    const items = [
      { id: 'c1', bpmProcessId: 'p1', bpmProcessName: 'Pengajuan Fasilitas KUR', code: 'C-1', name: 'Wawancara' },
      { id: 'c2', bpmProcessId: 'p2', bpmProcessName: 'Pelunasan Dipercepat', code: 'C-2', name: 'Verifikasi' },
      { id: 'c3', bpmProcessId: 'p1', bpmProcessName: 'Pengajuan Fasilitas KUR', code: 'C-3', name: 'Dukcapil' },
    ];
    expect(groupWorklistByProcess(items)).toEqual([
      { key: 'p1', title: 'Pengajuan Fasilitas KUR', items: [items[0], items[2]] },
      { key: 'p2', title: 'Pelunasan Dipercepat', items: [items[1]] },
    ]);
  });

  it('collects unlinked items under one group with a null title for i18n fallback', () => {
    const items = [
      { id: 'c9', bpmProcessId: null, bpmProcessName: null, code: 'C-9', name: 'Tanpa BPM' },
    ];
    expect(groupWorklistByProcess(items)).toEqual([
      { key: 'unlinked', title: null, items },
    ]);
  });

  it('classifies an empty worklist by whether the year has any controls', () => {
    expect(classifyWorklistEmpty(false)).toBe('no-controls');
    expect(classifyWorklistEmpty(true)).toBe('all-assessed');
  });
});
