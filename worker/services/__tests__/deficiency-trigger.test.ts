import { describe, it, expect } from 'vitest';
import { AppError } from '../../lib/utils';
import {
  triggerDeficiency,
  buildDedupKey,
  buildDeficiencyDescription,
  type DeficiencyTriggerEvent,
  type DeficiencyTriggerStore,
} from '../deficiency-trigger';

type StoredDeficiency = {
  id: string;
  organizationId: string;
  controlId: string | null;
  bpmProcessId: string | null;
  period: string;
  source: string;
  severity: string;
  identifiedBy: string;
  description: string;
};

type StoredActionPlan = {
  deficiencyId: string;
  description: string;
  status: string;
  workflowStatus: string;
  ownerId: string;
  dueDate: Date;
};

/** In-memory stand-in for the Drizzle adapter: no HTTP, no DB. */
class FakeDeficiencyStore implements DeficiencyTriggerStore {
  deficiencies: StoredDeficiency[] = [];
  actionPlans: StoredActionPlan[] = [];
  controls = new Map<string, { code: string; name: string }>([
    ['CTRL-A', { code: 'CTRL-A', name: 'Otorisasi Kredit' }],
    ['CTRL-B', { code: 'CTRL-B', name: 'Rekonsiliasi GL' }],
  ]);
  processes = new Map<string, { name: string; noGL: string | null }>([
    ['BPM-1', { name: 'Persetujuan Kredit', noGL: 'GL-100' }],
    ['BPM-2', { name: 'Pencairan Dana', noGL: 'GL-200' }],
  ]);

  async findOpenId(key: {
    organizationId: string;
    controlId: string | null;
    bpmProcessId: string | null;
    period: string;
    source: string;
  }): Promise<string | null> {
    const hit = this.deficiencies.find(
      (d) =>
        d.organizationId === key.organizationId &&
        d.controlId === key.controlId &&
        d.bpmProcessId === key.bpmProcessId &&
        d.period === key.period &&
        d.source === key.source,
    );
    return hit ? hit.id : null;
  }

  async resolveControl(controlId: string): Promise<{ code: string; name: string } | null> {
    return this.controls.get(controlId) ?? null;
  }

  async resolveBpmProcess(bpmProcessId: string): Promise<{ name: string; noGL: string | null } | null> {
    return this.processes.get(bpmProcessId) ?? null;
  }

  async insertDeficiency(row: Omit<StoredDeficiency, 'id'>): Promise<string> {
    const id = `DEF-${this.deficiencies.length + 1}`;
    this.deficiencies.push({ ...row, id });
    return id;
  }

  async insertActionPlan(row: StoredActionPlan): Promise<void> {
    this.actionPlans.push(row);
  }
}

const csaEvent = (overrides: Partial<DeficiencyTriggerEvent> = {}): DeficiencyTriggerEvent => ({
  organizationId: 'org-test',
  controlId: null,
  bpmProcessId: 'BPM-1',
  period: '2025-Q1',
  source: 'Lini 1 - CSA',
  userId: 'user-1',
  failedControlIds: ['CTRL-A', 'CTRL-B'],
  ...overrides,
});

describe('deficiency-trigger seam (structured find-or-create)', () => {
  it('creates exactly one deficiency per structured key; period rerun is idempotent', async () => {
    const store = new FakeDeficiencyStore();

    const first = await triggerDeficiency(csaEvent(), store);
    const second = await triggerDeficiency(csaEvent(), store);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.id).toBe(first.id);
    expect(store.deficiencies).toHaveLength(1);
    expect(store.actionPlans).toHaveLength(1);
  });

  it('TOD insert and update branches share one severity/prefix/dedup policy', async () => {
    const store = new FakeDeficiencyStore();
    const tod = (controlId: string): DeficiencyTriggerEvent => ({
      organizationId: 'org-test',
      controlId,
      bpmProcessId: null,
      period: 'TOD-Evaluation',
      source: 'Lini 2 - TOD Review',
      userId: 'user-2',
    });

    const insert = await triggerDeficiency(tod('CTRL-A'), store);
    const update = await triggerDeficiency(tod('CTRL-A'), store);
    const other = await triggerDeficiency(tod('CTRL-B'), store);

    expect(update.id).toBe(insert.id);
    expect(other.id).not.toBe(insert.id);
    expect(store.deficiencies).toHaveLength(2);
    for (const d of store.deficiencies) {
      expect(d.severity).toBe('Control Deficiency');
    }
    expect(store.deficiencies[0].description).toContain('[CTRL-A - Otorisasi Kredit]');
  });

  it('null-controlId BPM path keys by bpmProcessId, not by description text', async () => {
    const store = new FakeDeficiencyStore();

    const a1 = await triggerDeficiency(csaEvent({ bpmProcessId: 'BPM-1' }), store);
    const a2 = await triggerDeficiency(csaEvent({ bpmProcessId: 'BPM-1' }), store);
    const b = await triggerDeficiency(csaEvent({ bpmProcessId: 'BPM-2' }), store);

    expect(a2.id).toBe(a1.id);
    expect(b.id).not.toBe(a1.id);
    expect(store.deficiencies).toHaveLength(2);
    expect(store.deficiencies[0].description).toContain('Persetujuan Kredit');
  });

  it('source is part of the structured key', async () => {
    const store = new FakeDeficiencyStore();

    const lini1 = await triggerDeficiency(csaEvent({ source: 'Lini 1 - CSA' }), store);
    const lini2 = await triggerDeficiency(
      csaEvent({ source: 'Lini 2 - CSA Validation' }),
      store,
    );

    expect(lini2.id).not.toBe(lini1.id);
    expect(store.deficiencies).toHaveLength(2);
  });

  it('bootstraps one action plan carrying source + period with year-end due date', async () => {
    const store = new FakeDeficiencyStore();

    await triggerDeficiency(csaEvent(), store);

    expect(store.actionPlans).toHaveLength(1);
    const plan = store.actionPlans[0];
    expect(plan.description).toContain('Lini 1 - CSA');
    expect(plan.description).toContain('2025-Q1');
    expect(plan.status).toBe('Draft');
    expect(plan.workflowStatus).toBe('Ineffective');
    expect(plan.dueDate.getMonth()).toBe(11);
    expect(plan.dueDate.getDate()).toBe(31);
  });

  it('rejects events with missing structured-key fields via AppError(400)', async () => {
    const store = new FakeDeficiencyStore();

    const bad = csaEvent({ period: '  ' });
    const err = await triggerDeficiency(bad, store).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).status).toBe(400);
    expect(store.deficiencies).toHaveLength(0);
  });

  it('buildDedupKey normalizes empty strings to null for stable matching', () => {
    expect(
      buildDedupKey(csaEvent({ controlId: '', bpmProcessId: '' })),
    ).toEqual({
      organizationId: 'org-test',
      controlId: null,
      bpmProcessId: null,
      period: '2025-Q1',
      source: 'Lini 1 - CSA',
    });
  });

  it('buildDeficiencyDescription prefixes control code/name and names the BPM process', () => {
    const withControl = buildDeficiencyDescription(
      csaEvent({ controlId: 'CTRL-A', bpmProcessId: null }),
      { code: 'CTRL-A', name: 'Otorisasi Kredit' },
      null,
    );
    expect(withControl).toContain('[CTRL-A - Otorisasi Kredit]');

    const bpmOnly = buildDeficiencyDescription(
      csaEvent({ controlId: null, bpmProcessId: 'BPM-1' }),
      null,
      { name: 'Persetujuan Kredit', noGL: 'GL-100' },
    );
    expect(bpmOnly).toContain('Persetujuan Kredit');
    expect(bpmOnly).toContain('2025-Q1');
  });
});
