import { describe, it, expect } from 'vitest';
import { AppError } from '../../lib/utils';
import {
  LINI1_FIELDS,
  LINI2_FIELDS,
  CONTROL_FIELDS_MAP,
  TOD_EVALUATION_PERIOD,
  applyAssertionFallback,
  applyBatchUpdate,
  applyVerificationDesignPatch,
  createVerificationDesign,
  getCosoComponent,
  matchesNoGL,
  projectVerificationRow,
  toTodDecisionInput,
  type BatchUpdateItem,
  type RcmMappingRef,
  type RcmMatrixWriteStore,
  type TodEvalRow,
  type VerificationPatchBody,
} from '../rcm-matrix-write';
import type { DeficiencyTriggerEvent } from '../deficiency-trigger';

/** In-memory stand-in for the Drizzle adapter: no HTTP, no DB. */
class FakeMatrixStore implements RcmMatrixWriteStore {
  mappings = new Map<string, RcmMappingRef & Record<string, unknown>>();
  tods = new Map<string, TodEvalRow>();
  risks = new Map<string, Record<string, unknown>>();
  findMappingsCalls = 0;
  mappingUpdates: Array<{ id: string; patch: Record<string, unknown> }> = [];
  riskUpdates: Array<{ rcmId: string; patch: Record<string, unknown> }> = [];
  created: { rcms: unknown[]; controls: unknown[]; mappings: unknown[]; tods: unknown[] } = {
    rcms: [],
    controls: [],
    mappings: [],
    tods: [],
  };

  async findMapping(mappingId: string, organizationId: string) {
    const row = this.mappings.get(mappingId) ?? null;
    return row && row.organizationId === organizationId
      ? { id: row.id, organizationId: row.organizationId, rcmId: row.rcmId, controlId: row.controlId }
      : null;
  }

  async updateMapping(mappingId: string, patch: Record<string, unknown>) {
    const row = this.mappings.get(mappingId);
    if (row) Object.assign(row, patch);
    this.mappingUpdates.push({ id: mappingId, patch });
  }

  async findTod(controlId: string, organizationId: string) {
    const hit = [...this.tods.values()].find(
      (t) => t.controlId === controlId && t.organizationId === organizationId,
    );
    return hit ?? null;
  }

  async insertTod(row: TodEvalRow & { evaluatorId: string }) {
    this.tods.set(row.id, { ...row });
    this.created.tods.push(row);
  }

  async updateTod(todId: string, patch: Partial<TodEvalRow>) {
    const row = this.tods.get(todId);
    if (row) Object.assign(row, patch);
  }

  async findMappings(mappingIds: string[], organizationId: string) {
    this.findMappingsCalls += 1;
    return mappingIds
      .map((id) => this.mappings.get(id) ?? null)
      .filter((r): r is RcmMappingRef & Record<string, unknown> => r !== null && r.organizationId === organizationId)
      .map((r) => ({ id: r.id, organizationId: r.organizationId, rcmId: r.rcmId, controlId: r.controlId }));
  }

  async applyMappingUpdates(updates: Array<{ id: string; patch: Record<string, unknown> }>) {
    for (const u of updates) await this.updateMapping(u.id, u.patch);
  }

  async applyRiskUpdates(updates: Array<{ rcmId: string; patch: Record<string, unknown> }>) {
    for (const u of updates) {
      this.riskUpdates.push(u);
      this.risks.set(u.rcmId, { ...(this.risks.get(u.rcmId) ?? {}), ...u.patch });
    }
  }

  async insertRcm(row: Record<string, unknown>) {
    this.created.rcms.push(row);
  }

  async insertControl(row: Record<string, unknown>) {
    this.created.controls.push(row);
  }

  async insertMapping(row: Record<string, unknown>) {
    const ref = row as RcmMappingRef & Record<string, unknown>;
    this.mappings.set(ref.id, { ...ref });
    this.created.mappings.push(row);
  }
}

function setup(initial?: {
  mappings?: Array<RcmMappingRef & Record<string, unknown>>;
  tods?: TodEvalRow[];
}) {
  const store = new FakeMatrixStore();
  for (const m of initial?.mappings ?? []) store.mappings.set(m.id, { ...m });
  for (const t of initial?.tods ?? []) store.tods.set(t.id, { ...t });
  const raised: DeficiencyTriggerEvent[] = [];
  const deps = {
    store,
    effects: {
      raiseDeficiency: async (event: DeficiencyTriggerEvent) => {
        raised.push(event);
        return `DEF-${raised.length}`;
      },
    },
    now: () => new Date('2026-01-15T00:00:00Z'),
    newId: (() => {
      let n = 0;
      return () => `id-${(n += 1)}`;
    })(),
  };
  return { store, raised, deps };
}

const mapping = (overrides: Partial<RcmMappingRef> = {}): RcmMappingRef & Record<string, unknown> => ({
  id: 'map-1',
  organizationId: 'org-1',
  rcmId: 'rcm-1',
  controlId: 'ctrl-1',
  ...overrides,
});

const todRow = (overrides: Partial<TodEvalRow> = {}): TodEvalRow => ({
  id: 'tod-1',
  organizationId: 'org-1',
  controlId: 'ctrl-1',
  pilarObjective: 'obj',
  pilarTiming: 'time',
  pilarAuthority: 'auth',
  pilarReliability: 'rel',
  pilarCoverage: 'cov',
  pilarEvidence: 'evi',
  kkReference: 'KK-1',
  conclusion: 'Effective',
  comment: null,
  ...overrides,
});

const fullPilarsBody: VerificationPatchBody = {
  pilarObjective: 'obj',
  pilarTiming: 'time',
  pilarAuthority: 'auth',
  pilarReliability: 'rel',
  pilarCoverage: 'cov',
  pilarEvidence: 'evi',
  kkReference: 'KK-1',
  conclusion: 'Effective',
};

describe('rcm-matrix-write seam (consolidated verification writes)', () => {
  it('partitions lini1/lini2 allow-lists; unknown keys never reach the store', async () => {
    const { store, deps } = setup({ mappings: [mapping()] });
    const body = {
      controlName: 'Kas Opname',
      assertionE: 'Y',
      pilarObjective: 'obj',
      conclusion: 'Effective',
      pilarTiming: 'time',
      pilarAuthority: 'auth',
      pilarReliability: 'rel',
      pilarCoverage: 'cov',
      pilarEvidence: 'evi',
      isFraudRelated: true,
    } as VerificationPatchBody & { isFraudRelated: boolean };

    await applyVerificationDesignPatch(deps, {
      mappingId: 'map-1',
      organizationId: 'org-1',
      userId: 'user-1',
      body,
    });

    expect(store.mappingUpdates).toHaveLength(1);
    expect(store.mappingUpdates[0].patch).toEqual({ controlName: 'Kas Opname', assertionE: 'Y' });
    const tod = await store.findTod('ctrl-1', 'org-1');
    expect(tod?.pilarObjective).toBe('obj');
    expect(tod?.conclusion).toBe('Effective');
  });

  it('updates the existing TOD row instead of inserting a duplicate', async () => {
    const { store, deps } = setup({ mappings: [mapping()], tods: [todRow()] });

    await applyVerificationDesignPatch(deps, {
      mappingId: 'map-1',
      organizationId: 'org-1',
      userId: 'user-1',
      body: { ...fullPilarsBody, comment: 'reviewed' },
    });

    expect(store.tods.size).toBe(1);
    expect(store.tods.get('tod-1')?.comment).toBe('reviewed');
    expect(store.created.tods).toHaveLength(0);
  });

  it('forces Ineffective when a pilar is missing and raises a typed TOD deficiency', async () => {
    const { store, raised, deps } = setup({ mappings: [mapping()] });

    const result = await applyVerificationDesignPatch(deps, {
      mappingId: 'map-1',
      organizationId: 'org-1',
      userId: 'user-1',
      body: { ...fullPilarsBody, pilarEvidence: '', comment: 'kurang bukti' },
    });

    expect(result.todVerdict).toBe('Ineffective');
    expect(result.deficiencyId).toBe('DEF-1');
    expect(store.tods.size).toBe(1);
    const tod = [...store.tods.values()][0];
    expect(tod.conclusion).toBe('Ineffective');
    expect(raised).toHaveLength(1);
    expect(raised[0]).toEqual({
      organizationId: 'org-1',
      controlId: 'ctrl-1',
      bpmProcessId: null,
      period: TOD_EVALUATION_PERIOD,
      source: 'Lini 2 - TOD Review',
      userId: 'user-1',
      detail: 'kurang bukti',
    });
    expect('description' in raised[0]).toBe(false);
  });

  it('preserves a claimed Effective verdict when all six pilars hold; no deficiency', async () => {
    const { raised, deps } = setup({ mappings: [mapping()] });

    const result = await applyVerificationDesignPatch(deps, {
      mappingId: 'map-1',
      organizationId: 'org-1',
      userId: 'user-1',
      body: fullPilarsBody,
    });

    expect(result.todVerdict).toBe('Effective');
    expect(result.deficiencyId).toBeNull();
    expect(raised).toHaveLength(0);
  });

  it('skips the TOD decision entirely on lini1-only patches', async () => {
    const { store, raised, deps } = setup({
      mappings: [mapping()],
      tods: [todRow({ pilarEvidence: null, conclusion: 'Effective' })],
    });

    const result = await applyVerificationDesignPatch(deps, {
      mappingId: 'map-1',
      organizationId: 'org-1',
      userId: 'user-1',
      body: { controlName: 'Renamed' },
    });

    expect(result.todVerdict).toBeNull();
    expect(result.deficiencyId).toBeNull();
    expect(raised).toHaveLength(0);
    expect(store.tods.get('tod-1')?.conclusion).toBe('Effective');
  });

  it('throws an AppError(404) envelope for an unknown mapping', async () => {
    const { deps } = setup();
    const err = await applyVerificationDesignPatch(deps, {
      mappingId: 'missing',
      organizationId: 'org-1',
      userId: 'user-1',
      body: { controlName: 'x' },
    }).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).status).toBe(404);
  });

  it('batch consolidates reads and aliases automatedSubNature in one pass', async () => {
    const { store, deps } = setup({
      mappings: [mapping(), mapping({ id: 'map-2', controlId: 'ctrl-2' })],
    });
    const items: BatchUpdateItem[] = [
      { mappingId: 'map-1', riskDescription: 'R1', automatedSubNature: 'ITDM - IPE', controlName: 'C1' },
      { mappingId: 'map-2', riskRating: 'High', automatedControlType: 'MRC' },
      { controlName: 'no-mapping-id' },
      { mappingId: 'ghost', controlName: 'unknown mapping' },
    ];

    const result = await applyBatchUpdate(deps, { items, organizationId: 'org-1' });

    expect(result.updated).toBe(2);
    expect(store.findMappingsCalls).toBe(1);
    expect(store.mappingUpdates).toHaveLength(2);
    expect(store.mappingUpdates[0].patch).toEqual({ controlName: 'C1', automatedControlType: 'ITDM - IPE' });
    expect(store.mappingUpdates[1].patch).toEqual({ automatedControlType: 'MRC' });
    expect(store.riskUpdates).toHaveLength(2);
    expect(store.risks.get('rcm-1')).toMatchObject({ riskDescription: 'R1' });
  });

  it('assertion fallback prefers the explicit value over the account default', () => {
    expect(applyAssertionFallback({ assertionE: 'Y', defE: 'N' }).assertionE).toBe('Y');
    expect(applyAssertionFallback({ assertionE: null, defE: 'N' }).assertionE).toBe('N');
    expect(applyAssertionFallback({ defE: 'N' }).assertionE).toBe('N');
    expect(applyAssertionFallback({ assertionE: '', defE: 'N' }).assertionE).toBe('N');
  });

  it('projects the 30-field verification row with org enrichment and noGL filter', () => {
    const row = projectVerificationRow(
      {
        id: 'map-1',
        controlId: 'ctrl-1',
        controlName: 'Kas',
        control: {
          code: 'C-1',
          fsliCodes: ['GL-100'],
          todEvaluations: [{ pilarObjective: 'o', conclusion: 'Effective' as const }],
        },
      },
      { name: 'PT Induk', entityCode: 'ENT-1' },
    );

    expect(row.mappingId).toBe('map-1');
    expect(row.controlCode).toBe('C-1');
    expect(row.pilarObjective).toBe('o');
    expect(row.companyName).toBe('PT Induk');
    expect(row.locationCode).toBe('ENT-1');
    expect(matchesNoGL(['GL-100'], 'GL-100')).toBe(true);
    expect(matchesNoGL(['GL-200'], 'GL-100')).toBe(false);
    expect(matchesNoGL(null, 'GL-100')).toBe(false);
    expect(matchesNoGL(['GL-100'], undefined)).toBe(true);
  });

  it('getCosoComponent maps numeric principles to SK-5 components', () => {
    expect(getCosoComponent([1])).toBe('Control Environment');
    expect(getCosoComponent([5])).toBe('Control Environment');
    expect(getCosoComponent([6])).toBe('Risk Assessment');
    expect(getCosoComponent([10, 14])).toBe('Control Activities');
    expect(getCosoComponent([13])).toBe('Information & Communication');
    expect(getCosoComponent([17])).toBe('Monitoring Activities');
    expect(getCosoComponent([])).toBe('Entity-Level Control');
    expect(getCosoComponent(null)).toBe('Entity-Level Control');
    expect(getCosoComponent([99])).toBe('Entity-Level Control');
  });

  it('create validates the RCM choice and enforces 6-pilar on the fresh TOD', async () => {
    const { deps } = setup();
    const bad = await createVerificationDesign(deps, {
      organizationId: 'org-1',
      userId: 'user-1',
      createNewRcm: true,
      process: 'Procure',
    } as Parameters<typeof createVerificationDesign>[1]).catch((e: unknown) => e);
    expect(bad).toBeInstanceOf(AppError);
    expect((bad as AppError).status).toBe(400);

    const { store, raised, deps: deps2 } = setup();
    const result = await createVerificationDesign(deps2, {
      organizationId: 'org-1',
      userId: 'user-1',
      createNewRcm: true,
      process: 'Procure',
      subProcess: 'Pay',
      riskDescription: 'Risk',
      controlName: 'Ctrl',
      conclusion: 'Effective',
      comment: 'tanpa pilar',
    });

    expect(result.todVerdict).toBe('Ineffective');
    expect(result.deficiencyId).toBe('DEF-1');
    expect(raised[0].source).toBe('Lini 2 - TOD Review');
    expect(raised[0].detail).toBe('tanpa pilar');
    expect(store.created.rcms).toHaveLength(1);
    expect(store.created.controls).toHaveLength(1);
    expect(store.created.mappings).toHaveLength(1);
  });

  it('exposes the lini1/lini2 allow-lists and the FE->BE field map without duplicates', () => {
    expect(new Set(LINI1_FIELDS).size).toBe(LINI1_FIELDS.length);
    expect(new Set(LINI2_FIELDS).size).toBe(LINI2_FIELDS.length);
    expect(CONTROL_FIELDS_MAP.automatedSubNature).toBe('automatedControlType');
    expect(CONTROL_FIELDS_MAP.automatedControlType).toBe('automatedControlType');
    expect(toTodDecisionInput({ conclusion: 'Ineffective' }).claimedResult).toBe('Ineffective');
    expect(toTodDecisionInput({}).claimedResult).toBe('Effective');
  });
});
