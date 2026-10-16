import { describe, expect, it } from 'vitest';
import { resolvePostSaveView, shouldEnterForm, shouldFetchList } from './csa-view-transition';

describe('csa-view-transition seam', () => {
  it('enters form for samples without schedule', () => {
    expect(
      shouldEnterForm({
        scheduleId: null,
        linkedRecordId: null,
        initialSamplesCount: 2,
        override: null,
        isInitialized: false,
        isCheckingSchedule: false,
      }),
    ).toBe(true);
  });

  it('respects list override and initialized flag', () => {
    expect(
      shouldEnterForm({
        scheduleId: 's1',
        linkedRecordId: 'r1',
        initialSamplesCount: 0,
        override: 'list',
        isInitialized: false,
        isCheckingSchedule: false,
      }),
    ).toBe(false);
    expect(
      shouldEnterForm({
        scheduleId: null,
        linkedRecordId: null,
        initialSamplesCount: 2,
        override: null,
        isInitialized: true,
        isCheckingSchedule: false,
      }),
    ).toBe(false);
  });

  it('resolves post-save destination by draft flag', () => {
    expect(resolvePostSaveView(true)).toBe('form');
    expect(resolvePostSaveView(false)).toBe('list');
  });

  it('fetches list only on list view with process', () => {
    expect(shouldFetchList('list', true)).toBe(true);
    expect(shouldFetchList('form', true)).toBe(false);
    expect(shouldFetchList('list', false)).toBe(false);
  });
});
