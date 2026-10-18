import type { DrizzleDb } from '../db';
import { socEvaluations } from '../db/schema';
import { booleanField } from '../lib/coerce';

/**
 * The ONE SOC evaluation write (Lampiran 3.2.c.5: the seven mandatory criteria).
 *
 * Two routes reach it — `POST /soc-reports/:id/evaluate` (report id from the
 * path) and `POST /soc-evaluations` (report id from the body) — and each used to
 * assemble the same nine-attribute row itself, including the same
 * `?? false` coercion and the same `|| ''` opinion fallback.
 */

/** Stable code, produced once and asserted by the routes. */
export const SOC_EVALUATION_MISSING_REPORT = 'SOC_REPORT_ID_REQUIRED';

export interface SocEvaluationBody {
  /** Read by `POST /soc-evaluations`; the other caller takes it from the path. */
  socReportId?: unknown;
  attrA?: unknown;
  attrB?: unknown;
  attrC?: unknown;
  attrD?: unknown;
  attrE?: unknown;
  attrF?: unknown;
  attrG?: unknown;
  auditorOpinion?: unknown;
}

export type SocEvaluationOutcome =
  | { outcome: 'created'; id: string }
  | { outcome: 'rejected'; code: string; httpStatus: number; message: string };

export interface CreateSocEvaluationArgs {
  orgId: string;
  userId: string;
  /** `unknown`: one caller takes it from the path, the other from the body. */
  socReportId: unknown;
  body: SocEvaluationBody;
}

/**
 * The outcome is string-discriminated on purpose: worker code reachable from
 * `src/test` is type-checked with `strict: false`, where a boolean discriminant
 * does not narrow (`CODING_STANDARDS.md`).
 */
export async function createSocEvaluation(
  db: DrizzleDb,
  args: CreateSocEvaluationArgs,
): Promise<SocEvaluationOutcome> {
  const socReportId = args.socReportId;
  if (typeof socReportId !== 'string' || socReportId === '') {
    // `soc_evaluations.soc_report_id` is NOT NULL with a foreign key, so a
    // missing id used to surface as a 500 from the driver instead of a 400.
    return {
      outcome: 'rejected',
      code: SOC_EVALUATION_MISSING_REPORT,
      httpStatus: 400,
      message: 'socReportId is required',
    };
  }

  const id = crypto.randomUUID();
  await db.insert(socEvaluations).values({
    id,
    organizationId: args.orgId,
    socReportId,
    evaluatedBy: args.userId,
    attrA: booleanField(args.body.attrA),
    attrB: booleanField(args.body.attrB),
    attrC: booleanField(args.body.attrC),
    attrD: booleanField(args.body.attrD),
    attrE: booleanField(args.body.attrE),
    attrF: booleanField(args.body.attrF),
    attrG: booleanField(args.body.attrG),
    auditorOpinion: typeof args.body.auditorOpinion === 'string' ? args.body.auditorOpinion : '',
    evaluatedAt: new Date(),
  });

  return { outcome: 'created', id };
}
