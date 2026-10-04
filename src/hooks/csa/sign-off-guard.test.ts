import { describe, it, expect } from 'vitest';
import { checkSignOff } from './sign-off-guard';

function sample(controlResults: Record<string, object>) {
  return { sampleRef: 'S-1', controlResults };
}

describe('checkSignOff keeps GPS non-blocking', () => {
  it('passes when all Passed controls have evidence even with gps denied', () => {
    const values = {
      result: 'Effective',
      samples: [
        sample({
          'CTL-1': { implemented: true, evidenceUrl: 'https://cdn/a.jpg', evidenceMeta: { gpsStatus: 'denied', capturedAt: 1 } },
          'CTL-2': { implemented: true, evidenceUrl: 'https://cdn/b.jpg', evidenceMeta: { gpsStatus: 'timeout', capturedAt: 1 } },
        }),
      ],
    } as never;
    expect(checkSignOff(values)).toEqual({ blocked: false, realResult: 'Effective' });
  });

  it('still blocks Effective when evidence is missing regardless of GPS', () => {
    const values = {
      result: 'Effective',
      samples: [sample({ 'CTL-1': { implemented: true, evidenceMeta: { gpsStatus: 'granted', lat: -6.2, lng: 106.8 } } })],
    } as never;
    expect(checkSignOff(values)).toMatchObject({ blocked: true, reason: 'missing-evidence' });
  });

  it('forces Ineffective when any control fails even with GPS granted', () => {
    const values = {
      result: 'Effective',
      samples: [
        sample({
          'CTL-1': { implemented: false, evidenceMeta: { gpsStatus: 'granted', lat: -6.2, lng: 106.8, capturedAt: 1 } },
        }),
      ],
    } as never;
    expect(checkSignOff(values)).toMatchObject({ blocked: true, reason: 'failed-effective', realResult: 'Ineffective' });
  });
});
