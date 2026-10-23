import { describe, expect, it } from 'vitest';
import { COOLING_OFF_WINDOW_MS, isCoolingOffViolation, type OwnershipHistoryEntry } from './cooling-off';

const NOW = Date.UTC(2026, 9, 23);
const WINDOW_START = NOW - COOLING_OFF_WINDOW_MS;

const entry = (over: Partial<OwnershipHistoryEntry> = {}): OwnershipHistoryEntry => ({
  processId: 'BPM-1',
  role: 'Line 1',
  endDate: WINDOW_START + 1,
  ...over,
});

describe('cooling-off (Bab II)', () => {
  it('blocks testing a process owned as Line 1 inside the window', () => {
    expect(isCoolingOffViolation([entry()], 'BPM-1', NOW)).toBe(true);
  });

  it('blocks testing a process owned as Line 2 inside the window', () => {
    expect(isCoolingOffViolation([entry({ role: 'Line 2' })], 'BPM-1', NOW)).toBe(true);
  });

  it('treats the window as exclusive at exactly twelve months', () => {
    expect(isCoolingOffViolation([entry({ endDate: WINDOW_START })], 'BPM-1', NOW)).toBe(false);
    expect(isCoolingOffViolation([entry({ endDate: WINDOW_START + 1 })], 'BPM-1', NOW)).toBe(true);
  });

  it('ignores ownership that ended before the window', () => {
    expect(isCoolingOffViolation([entry({ endDate: WINDOW_START - 1 })], 'BPM-1', NOW)).toBe(false);
  });

  it('ignores another process and non-operational roles', () => {
    expect(isCoolingOffViolation([entry({ processId: 'BPM-2' })], 'BPM-1', NOW)).toBe(false);
    expect(isCoolingOffViolation([entry({ role: 'Line 3' })], 'BPM-1', NOW)).toBe(false);
    expect(isCoolingOffViolation([entry({ role: 'Commissioner' })], 'BPM-1', NOW)).toBe(false);
  });

  it('fails open only when there is no history or no process to match', () => {
    expect(isCoolingOffViolation([], 'BPM-1', NOW)).toBe(false);
    expect(isCoolingOffViolation(undefined, 'BPM-1', NOW)).toBe(false);
    expect(isCoolingOffViolation(null, 'BPM-1', NOW)).toBe(false);
    expect(isCoolingOffViolation([entry()], null, NOW)).toBe(false);
    expect(isCoolingOffViolation([entry()], '', NOW)).toBe(false);
  });
});
