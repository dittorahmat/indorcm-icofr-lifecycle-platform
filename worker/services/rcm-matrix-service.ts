import { eq, and, inArray } from 'drizzle-orm';
import { rcmControls, todEvaluations, organization } from '../db/schema';
import type { DrizzleDb } from '../db';
import type {
  CreateVerificationDesignBody,
  VerificationBatchUpdateItem,
  VerificationDesignPatchBody,
} from '@shared/types';
import {
  applyAssertionFallback, applyBatchUpdate, applyVerificationDesignPatch, createVerificationDesign,
  getCosoComponent, matchesNoGL, projectVerificationRow,
} from './rcm-matrix-write';
import { createMatrixWriteDeps } from './rcm-matrix-drizzle';
import { buildMatrixSelect, type MatrixReadInput } from './rcm-matrix-select';

interface TodPilarFields {
  pilarObjective: string | null;
  pilarTiming: string | null;
  pilarAuthority: string | null;
  pilarReliability: string | null;
  pilarCoverage: string | null;
  pilarEvidence: string | null;
  kkReference: string | null;
  conclusion: string | null;
  comment: string | null;
  evaluatorId: string | null;
}

/** Thin facade over the rcm-matrix-write domain module (arch-09 T4).
 *  Matrix reads go through the single TLC/ELC/ITGC select builder
 *  (rcm-matrix-select.ts, arch-09 R9-3) and differ only in their projection
 *  tail; verification writes (allow-lists, TOD upsert via decideTest,
 *  auto-deficiency, consolidated batch) live behind the domain seam. */
export class RcmMatrixService {
  constructor(private db: DrizzleDb) {}

  private async attachTods<T extends { controlId: string }>(orgId: string, rows: T[]): Promise<(T & TodPilarFields)[]> {
    const controlIds = rows.map(r => r.controlId);
    const tods: (typeof todEvaluations.$inferSelect)[] = controlIds.length > 0
      ? await this.db.select().from(todEvaluations)
        .where(and(
          inArray(todEvaluations.controlId, controlIds),
          eq(todEvaluations.organizationId, orgId)
        ))
      : [];
    const todMap = new Map<string, typeof todEvaluations.$inferSelect>(tods.map(t => [t.controlId, t]));
    return rows.map(row => {
      const tod = todMap.get(row.controlId);
      return {
        ...row,
        pilarObjective: tod?.pilarObjective ?? null,
        pilarTiming: tod?.pilarTiming ?? null,
        pilarAuthority: tod?.pilarAuthority ?? null,
        pilarReliability: tod?.pilarReliability ?? null,
        pilarCoverage: tod?.pilarCoverage ?? null,
        pilarEvidence: tod?.pilarEvidence ?? null,
        kkReference: tod?.kkReference ?? null,
        conclusion: tod?.conclusion ?? null,
        comment: tod?.comment ?? null,
        evaluatorId: tod?.evaluatorId ?? null,
      };
    });
  }

  private async orgMeta(orgId: string): Promise<{ companyName: string; locationCode: string }> {
    const org = await this.db.select().from(organization).where(eq(organization.id, orgId)).then((rows) => rows[0]);
    return { companyName: org?.name ?? 'N/A', locationCode: org?.entityCode ?? 'N/A' };
  }

  /** Every matrix level reads through the one builder: SQL per kind lives in
   *  the builder, each getter keeps only its own projection tail. */
  private async readMatrix(input: MatrixReadInput) {
    const results = await buildMatrixSelect(this.db, input);
    const withTods = await this.attachTods(input.orgId, results);
    const org = await this.orgMeta(input.orgId);
    return { withTods, org };
  }

  async getTlcMatrix(orgId: string, bpmProcessId?: string, year?: string, noGL?: string) {
    const { withTods, org } = await this.readMatrix({ kind: 'TLC', orgId, bpmProcessId, year, noGL });
    return withTods.map((row) => ({ ...applyAssertionFallback(row), ...org }));
  }

  async getElcMatrix(orgId: string, year?: string) {
    const { withTods, org } = await this.readMatrix({ kind: 'ELC', orgId, year });
    return withTods.map((row) => ({ ...row, cosoComponent: getCosoComponent(row.cosoPrinciples), ...org }));
  }

  async getItgcMatrix(orgId: string, year?: string, bpmProcessId?: string) {
    const { withTods, org } = await this.readMatrix({ kind: 'ITGC', orgId, year, bpmProcessId });
    return withTods.map((row) => ({ ...row, ...org }));
  }

  async getVerificationDesign(orgId: string, filters: { bpmProcessId?: string; year?: string; noGL?: string }) {
    const { bpmProcessId, year, noGL } = filters;
    const results = await this.db.query.rcmControls.findMany({
      where: and(
        eq(rcmControls.organizationId, orgId),
        bpmProcessId && bpmProcessId !== 'undefined' ? eq(rcmControls.rcmId, bpmProcessId) : undefined,
        year && year !== 'undefined' ? eq(rcmControls.year, parseInt(year)) : undefined
      ),
      with: {
        rcm: true,
        control: {
          with: {
            todEvaluations: true
          }
        }
      }
    });
    const org = await this.orgMeta(orgId);
    return results
      .filter((m) => matchesNoGL(m.control?.fsliCodes ?? null, noGL))
      .map((m) => projectVerificationRow(
        {
          ...m,
          control: m.control ? {
            code: m.control.code,
            fsliCodes: m.control.fsliCodes,
            todEvaluations: m.control.todEvaluations,
          } : null,
        },
        { name: org.companyName, entityCode: org.locationCode },
      ));
  }

  /** Write seam delegates — allow-lists, TOD decideTest, deficiency fan-out and
   *  consolidated batch live in the domain module. AppError propagates to onError. */
  async patchVerificationDesign(orgId: string, userId: string, mappingId: string, body: VerificationDesignPatchBody) {
    return applyVerificationDesignPatch(createMatrixWriteDeps(this.db, orgId), {
      mappingId, organizationId: orgId, userId, body,
    });
  }

  async batchUpdateMatrix(orgId: string, items: VerificationBatchUpdateItem[]) {
    return applyBatchUpdate(createMatrixWriteDeps(this.db, orgId), { items, organizationId: orgId });
  }

  async saveVerificationDesign(orgId: string, userId: string, body: CreateVerificationDesignBody) {
    return createVerificationDesign(createMatrixWriteDeps(this.db, orgId), {
      ...body, organizationId: orgId, userId,
    });
  }
}
