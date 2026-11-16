import { describe, it, expect } from 'vitest';
import { buildBpmDeepLinkUrl, formatBpmStepLabel } from '../bpm-link';

describe('buildBpmDeepLinkUrl', () => {
  it('constructs canonical URL with diagramId and nodeId', () => {
    expect(buildBpmDeepLinkUrl('diag-1', 'node-1')).toBe('/bpm?diagramId=diag-1&nodeId=node-1');
  });

  it('handles only diagramId', () => {
    expect(buildBpmDeepLinkUrl('diag-1', null)).toBe('/bpm?diagramId=diag-1');
  });

  it('handles only nodeId', () => {
    expect(buildBpmDeepLinkUrl(null, 'node-1')).toBe('/bpm?nodeId=node-1');
  });

  it('falls back to /bpm when both are empty', () => {
    expect(buildBpmDeepLinkUrl(null, null)).toBe('/bpm');
  });
});

describe('formatBpmStepLabel', () => {
  it('truncates labels longer than maxLength', () => {
    expect(formatBpmStepLabel('very-long-node-id-that-exceeds-limit')).toBe('BPM Step');
  });

  it('returns short node id verbatim', () => {
    expect(formatBpmStepLabel('node-1')).toBe('node-1');
  });

  it('uses fallback when nodeId is missing', () => {
    expect(formatBpmStepLabel(null, 'CUSTOM')).toBe('CUSTOM');
  });
});
