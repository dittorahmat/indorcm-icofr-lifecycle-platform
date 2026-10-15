import { describe, expect, it } from 'vitest';
import { channelOffsetFor } from './edge-channel';

const EDGES = [
  { id: 'e-b', source: 'a', target: 'b' },
  { id: 'e-a', source: 'a', target: 'b' },
  { id: 'e-c', source: 'b', target: 'a' },
  { id: 'solo', source: 'a', target: 'c' },
];

describe('edge-channel seam (parallel-edge channel offset)', () => {
  it('returns zero for a solitary edge', () => {
    expect(channelOffsetFor('solo', 'a', 'c', EDGES)).toBe(0);
  });

  it('returns zero for an unknown id', () => {
    expect(channelOffsetFor('ghost', 'a', 'b', EDGES)).toBe(0);
  });

  it('spreads three parallels symmetrically around zero', () => {
    expect(channelOffsetFor('e-a', 'a', 'b', EDGES)).toBe(-20);
    expect(channelOffsetFor('e-b', 'a', 'b', EDGES)).toBe(0);
    expect(channelOffsetFor('e-c', 'a', 'b', EDGES)).toBe(20);
  });

  it('treats reversed pairs as parallel', () => {
    expect(channelOffsetFor('e-c', 'b', 'a', EDGES)).toBe(20);
  });
});
