import type { CSAFormValues } from './use-csa-form';

export interface SignOffCheck {
  blocked: boolean;
  reason?: 'missing-evidence' | 'failed-effective';
  realResult: 'Effective' | 'Ineffective' | 'No Transaction';
}

/**
 * Pure sign-off guard. GPS Fase-1 metadata is intentionally NOT a blocker:
 * proofs with gpsStatus denied/timeout/unavailable still pass as long as
 * every Passed control has evidence. SK-5 does not require GPS for a valid CSA.
 */
export function checkSignOff(values: Pick<CSAFormValues, 'samples' | 'result'>): SignOffCheck {
  const flatResults = values.samples.flatMap((s) => Object.values(s.controlResults));
  const anySampleFailed = flatResults.some((r) => !r.implemented);
  const anyMissingEvidence = flatResults.some((r) => r.implemented && !r.evidenceUrl);
  const realResult = (anySampleFailed ? 'Ineffective' : values.result) as SignOffCheck['realResult'];
  if (anyMissingEvidence && values.result === 'Effective') {
    return { blocked: true, reason: 'missing-evidence', realResult };
  }
  if (anySampleFailed && values.result === 'Effective') {
    return { blocked: true, reason: 'failed-effective', realResult };
  }
  return { blocked: false, realResult };
}
