import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeficiencyService } from '../deficiency-service';
import { sql } from 'drizzle-orm';

describe('DeficiencyService - Granular Deduplication', () => {
  let mockDb: any;
  let defService: DeficiencyService;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('allows separate open deficiencies for different control IDs in the same period', async () => {
    const insertedDeficiencies: any[] = [];
    const insertedActionPlans: any[] = [];

    mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => {
              // Return empty if no match found
              return Promise.resolve([]);
            })
          }))
        })
      }),
      query: {
        controls: {
          findFirst: vi.fn().mockImplementation(({ where }: any) => {
            return Promise.resolve({ code: 'CTRL-001', name: 'Sample Control' });
          })
        }
      },
      insert: vi.fn().mockImplementation((table: any) => ({
        values: vi.fn().mockImplementation((val: any) => {
          if (val.severity) {
            insertedDeficiencies.push(val);
          } else {
            insertedActionPlans.push(val);
          }
          return Promise.resolve();
        })
      }))
    };

    defService = new DeficiencyService(mockDb);

    const defId1 = await defService.createAutoDeficiency({
      organizationId: 'org-test',
      controlId: 'CTRL-A',
      description: 'Hasil CSA Ineffective untuk kontrol CTRL-A (periode 2025-Q1).',
      source: 'Lini 1 - CSA',
      userId: 'user-1',
      period: '2025-Q1'
    });

    const defId2 = await defService.createAutoDeficiency({
      organizationId: 'org-test',
      controlId: 'CTRL-B',
      description: 'Hasil CSA Ineffective untuk kontrol CTRL-B (periode 2025-Q1).',
      source: 'Lini 1 - CSA',
      userId: 'user-1',
      period: '2025-Q1'
    });

    expect(defId1).toBeDefined();
    expect(defId2).toBeDefined();
    expect(defId1).not.toBe(defId2);
    expect(insertedDeficiencies).toHaveLength(2);
    expect(insertedActionPlans).toHaveLength(2);
    expect(insertedActionPlans[0].workflowStatus).toBe('Ineffective');
  });

  it('deduplicates when the exact same controlId and period already has an Open deficiency', async () => {
    mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 'existing-open-def-id' }])
          })
        })
      }),
      insert: vi.fn()
    };

    defService = new DeficiencyService(mockDb);

    const defId = await defService.createAutoDeficiency({
      organizationId: 'org-test',
      controlId: 'CTRL-A',
      description: 'Hasil CSA Ineffective untuk kontrol CTRL-A (periode 2025-Q1).',
      source: 'Lini 1 - CSA',
      userId: 'user-1',
      period: '2025-Q1'
    });

    expect(defId).toBe('existing-open-def-id');
    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});
