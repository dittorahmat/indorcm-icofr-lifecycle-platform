import { Hono } from "hono";
import type { HonoEnv } from '../../app';
import { ok, bad } from '../../lib/utils';
import { getDb } from '../../db';
import { bpmProcesses, controls, csaRecords, rcmControls, rcms } from '../../db/schema';
import { and, eq, inArray, sql, or } from 'drizzle-orm';
import { unassessedControlsFrom } from '@shared/csa-worklist';
import type { CSAWorklistItem } from '@shared/types';

export const csaWorklistRoute = new Hono<HonoEnv>();

/**
 * Thin adapter over the shared derive seam: controls of the working year
 * without a non-draft CSA record. "Belum dinilai" is derived from record
 * existence — never from controls.csa_status, which the save flow leaves stale.
 */
csaWorklistRoute.get('/csa/worklist', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const yearParam = c.req.query('year');
  const year = yearParam ? Number(yearParam) : NaN;
  if (!yearParam || !Number.isInteger(year)) {
    return bad(c, 'Year parameter is required');
  }

  const controlRows = await db
    .select({
      id: controls.id,
      organizationId: controls.organizationId,
      year: controls.year,
      bpmProcessId: controls.bpmProcessId,
      code: controls.code,
      name: controls.name,
      level: controls.level,
      bpmProcessName: bpmProcesses.name,
      noGL: bpmProcesses.noGL,
    })
    .from(controls)
    .leftJoin(bpmProcesses, eq(controls.bpmProcessId, bpmProcesses.id))
    .where(and(eq(controls.organizationId, orgId), eq(controls.year, year)));

  const recordRows = await db
    .select({
      organizationId: csaRecords.organizationId,
      controlId: csaRecords.controlId,
      bpmProcessId: csaRecords.bpmProcessId,
      period: csaRecords.period,
      isDraft: csaRecords.isDraft,
    })
    .from(csaRecords)
    .where(
      and(
        eq(csaRecords.organizationId, orgId),
        or(
          eq(csaRecords.period, yearParam),
          sql`${csaRecords.period} LIKE ${yearParam + '-%'}`,
          sql`${csaRecords.period} LIKE ${'%-Q%'} AND ${csaRecords.period} LIKE ${'%' + yearParam + '%'}`,
          sql`EXTRACT(YEAR FROM ${csaRecords.assessmentDate}) = ${year}`
        )
      ),
    );

  const unassessed = unassessedControlsFrom(controlRows, recordRows, {
    organizationId: orgId,
    year,
  });

  const riskByControl = new Map<string, string>();
  if (unassessed.length > 0) {
    const riskRows = await db
      .select({ controlId: rcmControls.controlId, riskDescription: rcms.riskDescription })
      .from(rcmControls)
      .innerJoin(rcms, eq(rcmControls.rcmId, rcms.id))
      .where(
        and(
          eq(rcmControls.organizationId, orgId),
          inArray(
            rcmControls.controlId,
            unassessed.map((item) => item.id),
          ),
        ),
      );
    for (const row of riskRows) {
      if (!riskByControl.has(row.controlId)) {
        riskByControl.set(row.controlId, row.riskDescription);
      }
    }
  }

  const items: CSAWorklistItem[] = unassessed.map((item) => ({
    controlId: item.id,
    code: item.code,
    name: item.name,
    level: item.level,
    bpmProcessId: item.bpmProcessId,
    bpmProcessName: item.bpmProcessName,
    noGL: item.noGL,
    riskDescription: riskByControl.get(item.id) ?? null,
  }));

  return ok(c, { items, totalControls: controlRows.length });
});
