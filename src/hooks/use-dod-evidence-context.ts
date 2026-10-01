import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Deficiency, DoDEvidenceContext, MaterialitySimulation, Control } from '@shared/types';

interface UseDoDEvidenceContextProps {
  deficiency: Deficiency | null;
  performanceMateriality?: number;
  overallMateriality?: number;
}

export function useDoDEvidenceContext({
  deficiency,
  performanceMateriality,
  overallMateriality,
}: UseDoDEvidenceContextProps) {
  // Query Materiality Simulations for PM / OM benchmark if not directly passed
  const { data: simulationsData } = useQuery({
    queryKey: ['simulations', 'latest'],
    queryFn: () => api<{ items: MaterialitySimulation[] }>('/api/simulations'),
    staleTime: 5 * 60 * 1000,
  });

  const latestSim = simulationsData?.items?.[0];
  const pmThreshold = performanceMateriality || latestSim?.pmValue || 5_000_000_000;
  const omThreshold = overallMateriality || latestSim?.omValue || 10_000_000_000;

  // Query Controls to locate potential compensating controls
  const { data: controlsData } = useQuery({
    queryKey: ['controls'],
    queryFn: () => api<{ items: Control[] }>('/api/controls'),
    staleTime: 5 * 60 * 1000,
  });

  const allControls = controlsData?.items || [];
  
  // Find related controls that could act as compensating controls (excluding current control)
  const compensatingControls: NonNullable<DoDEvidenceContext['compensatingControls']> = allControls
    .filter(c => deficiency ? c.id !== deficiency.controlId : true)
    .slice(0, 5)
    .map(c => ({
      id: c.id,
      code: c.code,
      name: c.name,
      nature: c.nature || 'Manual',
      status: (c.line2Validation?.status === 'Validated' ? 'Effective' : 'Ineffective') as "Effective" | "Ineffective",
      precision: (c.type === 'Preventive' ? 'Sufficient' : 'Insufficient') as "Sufficient" | "Insufficient",
    }));

  // Construct automated evidence context
  const exposureNum = deficiency?.exposureValue || 0;
  const isAbovePM = exposureNum >= pmThreshold;

  const evidenceContext: DoDEvidenceContext = {
    testRecord: {
      id: 'WP-TOE-DEFAULT',
      testType: 'TOE',
      workpaperRef: `WP-${deficiency?.controlCode || 'CTRL'}-${new Date().getFullYear()}`,
      sampleCount: 25,
      failedSampleCount: 3,
      exceptionRate: 12.0,
      method: 'Inspection & Reperformance',
    },
    materiality: {
      omThreshold,
      pmThreshold,
      accountBalance: exposureNum * 1.5,
      exposureRatio: pmThreshold > 0 ? (exposureNum / pmThreshold) * 100 : 0,
      isAbovePM,
    },
    compensatingControls: compensatingControls.length > 0 ? compensatingControls : [
      {
        id: 'comp-1',
        code: 'CTRL-FIN-013',
        name: 'Secondary Detective Variance Review',
        nature: 'Manual',
        status: 'Effective',
        precision: 'Sufficient',
      }
    ],
    redFlags: deficiency?.preAssessment || {
      seniorManagementFraud: false,
      materialFraudImpact: false,
      restatement: false,
      auditorIdentifiedMisstatement: isAbovePM,
      ineffectiveAuditCommittee: false,
    },
  };

  return {
    evidenceContext,
    pmThreshold,
    omThreshold,
  };
}
