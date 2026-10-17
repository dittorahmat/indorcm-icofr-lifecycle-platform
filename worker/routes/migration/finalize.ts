import { Hono } from 'hono';
import type { HonoEnv } from '../../app';
import { getDb } from '../../db';
import * as schema from '../../db/schema';
import { bad, ok } from '../../lib/utils';
import { rbac } from '../../lib/guard';
import { ScopingService, normalizeYear, type GlRowIngest } from '../../services/scoping-service';
import { aggregateFsliBalances } from '@shared/scoping-materiality';

/**
 * Smart-import boundary shapes. The wizard stages parsed TB / RCM rows
 * client-side and posts them whole, so every field is optional here and the
 * route maps them onto columns.
 */
interface TbImportRow {
  accountCode?: string | null;
  accountName?: string | null;
  balance?: string | number | null;
  fsliBalance?: string | number | null;
  entityCode?: string | null;
  parentEntityCode?: string | null;
  suggestedFsli?: string | null;
  confidence?: number | null;
  noUrut?: number | null;
  currency?: string | null;
  ymd?: string | null;
  category?: string | null;
  subKategori?: string | null;
  fsliCode?: string | null;
}

interface RcmImportRow {
  processName?: string | null;
  accountCode?: string | null;
  affectedFsliItem?: string | null;
  riskDescription?: string | null;
  level?: string | null;
  controlCode?: string | null;
  controlName?: string | null;
  controlDescription?: string | null;
  controlNature?: string | null;
  nature?: string | null;
  controlType?: string | null;
  type?: string | null;
  frequency?: string | null;
  supportingApp?: string | null;
  executorRole?: string | null;
  cosoPrinciples?: number[];
  isKeyControl?: boolean | null;
  guessedFields?: string[];
  effectivePeriod?: string | null;
  ipoC?: unknown;
  ipoA?: unknown;
  ipoV?: unknown;
  ipoRa?: unknown;
  assertionC?: unknown;
  assertionA?: unknown;
  assertionE?: unknown;
  assertionCo?: unknown;
  assertionRo?: unknown;
  assertionVa?: unknown;
  assertionPd?: unknown;
}

interface FinalizeBody {
  year?: string | number | null;
  tbFileName?: string;
  tbData?: TbImportRow[];
  rcmData?: RcmImportRow[];
  simulationParams?: {
    basis?: string | null;
    omPercentage?: number;
    haircutPercentage?: number;
    locationCount?: number;
    omValue?: number;
    pmValue?: number;
  } | null;
}

const finalizeRoutes = new Hono<HonoEnv>();

finalizeRoutes.post('/migration/finalize', rbac(['Line 2', 'Admin']), async (c) => {
  const body = await c.req.json<FinalizeBody>();
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');

  const year = normalizeYear(body.year);
  if (year === null) return bad(c, 'MIGRATION_YEAR_REQUIRED', 400);

  const tbData = body.tbData ?? [];
  const rcmData = body.rcmData ?? [];
  const params = body.simulationParams;

  // One transaction: snapshot + rows + baseline simulation + RCM fan-out are
  // a single direction-changing step (a mid-list failure used to half-write).
  await db.transaction(async (tx) => {
    if (tbData.length > 0) {
      const toGlRow = (row: TbImportRow, idx: number): GlRowIngest => ({
        ymd: row.ymd || String(year),
        entityCode: row.entityCode ?? null,
        parentEntityCode: row.parentEntityCode ?? null,
        entityId: null,
        noGL: row.accountCode ?? null,
        glDesc: row.accountName ?? null,
        currency: row.currency || 'IDR',
        balance: Number.parseFloat(String(row.balance ?? '')) || 0,
        fsliBalance: Number.parseFloat(String(row.fsliBalance ?? '')) || 0,
        fsliCode: row.fsliCode ?? null,
        fsliName: row.suggestedFsli ?? null,
        category: row.category ?? null,
        subKategori: row.subKategori ?? null,
        noUrut: row.noUrut || idx + 1,
        mappingConfidence: row.confidence ?? null,
        assignedDepartmentIds: [],
        ownerAcceptance: null,
      });

      const { id: snapshotId } = await new ScopingService(tx).createGlSnapshot(orgId, {
        filename: body.tbFileName || `Migration_${year}_TB`,
        year,
        status: 'Mapped',
        isActive: true,
        rows: tbData.map(toGlRow),
      });

      await tx.insert(schema.simulations).values({
        id: `sim_${crypto.randomUUID()}`,
        organizationId: orgId,
        glSnapshotId: snapshotId,
        name: `Baseline ${year}`,
        year,
        status: 'Draft',
        workflowStatus: 'Draft',
        basis: params?.basis || null,
        omPercentage: params?.omPercentage || 0,
        haircutPercentage: params?.haircutPercentage || 0,
        locationCount: params?.locationCount || 1,
        omValue: params?.omValue || 0,
        pmValue: params?.pmValue || 0,
        createdBy: userId,
        createdAt: new Date(),
        significantAccounts: aggregateFsliBalances(tbData, params?.pmValue || 0),
      });
    }

    if (rcmData.length > 0) {
      const processes = Array.from(new Set(rcmData.map((r) => r.processName ?? '')));

      for (const procName of processes) {
        const processId = `proc_${crypto.randomUUID()}`;
        const procRows = rcmData.filter((r) => (r.processName ?? '') === procName);

        await tx.insert(schema.bpmProcesses).values({
          id: processId,
          organizationId: orgId,
          noGL: procRows[0]?.accountCode || '',
          fsliName: procRows[0]?.affectedFsliItem || null,
          name: procName,
          year,
          workflowStatus: 'Draft',
          createdAt: new Date(),
        });

        await tx.insert(schema.bpmDiagrams).values({
          id: `diag_${crypto.randomUUID()}`,
          organizationId: orgId,
          name: `Flow: ${procName}`,
          subProcess: procName,
          year,
          nodes: [],
          edges: [],
          createdAt: new Date(),
        });

        const risks = Array.from(new Set(procRows.map((r) => r.riskDescription ?? '')));

        for (const riskDesc of risks) {
          const riskId = `risk_${crypto.randomUUID()}`;
          const riskRows = procRows.filter((r) => (r.riskDescription ?? '') === riskDesc);

          await tx.insert(schema.rcms).values({
            id: riskId,
            organizationId: orgId,
            process: procName,
            subProcess: procName,
            year,
            riskDescription: riskDesc,
            status: 'Active',
          });

          for (const row of riskRows) {
            const controlId = `ctrl_${crypto.randomUUID()}`;

            await tx.insert(schema.controls).values({
              id: controlId,
              organizationId: orgId,
              bpmProcessId: row.level === 'ELC' ? null : processId,
              year,
              code: row.controlCode || `CTRL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
              name: row.controlName || 'Migrated Control',
              description: row.controlDescription ?? null,
              nature: row.controlNature || row.nature || null,
              type: row.controlType || row.type || null,
              frequency: row.frequency ?? null,
              level: row.level || 'TLC',
              isKeyControl: row.isKeyControl ?? true,
              isMigrated: true,
              supportingApp: row.supportingApp ?? null,
              executorRole: row.executorRole ?? null,
              cosoPrinciples: row.cosoPrinciples || [],
              ipos: row.level === 'TLC' ? [
                { type: 'C', value: !!row.ipoC },
                { type: 'A', value: !!row.ipoA },
                { type: 'V', value: !!row.ipoV },
                { type: 'RA', value: !!row.ipoRa },
              ] : [],
              assertions: row.level === 'TLC' ? [
                { type: 'C', value: !!row.assertionC },
                { type: 'A', value: !!row.assertionA },
                { type: 'E', value: !!row.assertionE },
                { type: 'CO', value: !!row.assertionCo },
                { type: 'RO', value: !!row.assertionRo },
                { type: 'VA', value: !!row.assertionVa },
                { type: 'PD', value: !!row.assertionPd },
              ] : [],
              aiGuessedFields: row.guessedFields || [],
            });

            await tx.insert(schema.rcmControls).values({
              id: crypto.randomUUID(),
              organizationId: orgId,
              rcmId: riskId,
              controlId,
              year,
              controlName: row.controlName ?? null,
              controlDescription: row.controlDescription ?? null,
              isKeyControl: row.isKeyControl ?? true,
              ipoC: row.ipoC ? 'Y' : 'N',
              ipoA: row.ipoA ? 'Y' : 'N',
              ipoV: row.ipoV ? 'Y' : 'N',
              ipoRa: row.ipoRa ? 'Y' : 'N',
              assertionE: row.assertionE ? 'Y' : 'N',
              assertionC: row.assertionC ? 'Y' : 'N',
              assertionA: row.assertionA ? 'Y' : 'N',
              assertionCo: row.assertionCo ? 'Y' : 'N',
              assertionVa: row.assertionVa ? 'Y' : 'N',
              assertionRo: row.assertionRo ? 'Y' : 'N',
              assertionPd: row.assertionPd ? 'Y' : 'N',
              controlType: row.controlType || row.type || null,
              controlNature: row.controlNature || row.nature || null,
              frequency: row.frequency ?? null,
              supportingApp: row.supportingApp ?? null,
              executorRole: row.executorRole ?? null,
              affectedFsliItem: row.affectedFsliItem ?? null,
              effectivePeriod: row.effectivePeriod ?? null,
              cosoPrinciples: row.cosoPrinciples || [],
            });
          }
        }
      }
    }
  });

  return ok(c, { success: true });
});

export default finalizeRoutes;
