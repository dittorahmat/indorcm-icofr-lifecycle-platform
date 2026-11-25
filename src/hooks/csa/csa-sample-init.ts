import type { ControlResultEntry, RiskControlPair } from '@/components/bpm/csa/csa-form-types';

export interface ControlOptionLike {
  id: string;
  name: string;
  code?: string;
  description?: string;
}

export interface CreateSampleControlResultsParams {
  activeControls: readonly ControlOptionLike[];
  bpmRiskControlPairs?: readonly RiskControlPair[];
  defaultImplemented?: boolean;
}

/**
 * Single source of truth for generating default control results on fresh CSA samples.
 * Prevents drift between use-csa (bulk transaction import) and CSAForm (manual row append).
 */
export function createDefaultSampleControlResults({
  activeControls,
  bpmRiskControlPairs = [],
  defaultImplemented = true,
}: CreateSampleControlResultsParams): Record<string, ControlResultEntry> {
  const controlResults: Record<string, ControlResultEntry> = {};

  if (bpmRiskControlPairs.length > 0) {
    bpmRiskControlPairs.forEach((pair) => {
      controlResults[pair.controlId] = {
        implemented: defaultImplemented,
        riskId: pair.riskId || '',
        riskName: pair.riskName || 'N/A',
        controlName: pair.controlName || 'N/A',
        evidenceUrl: '',
        comment: '',
      };
    });
  } else {
    activeControls.forEach((ctrl) => {
      controlResults[ctrl.id] = {
        implemented: defaultImplemented,
        riskId: '',
        riskName: ctrl.description || 'N/A',
        controlName: ctrl.name || 'N/A',
        evidenceUrl: '',
        comment: '',
      };
    });
  }

  return controlResults;
}
