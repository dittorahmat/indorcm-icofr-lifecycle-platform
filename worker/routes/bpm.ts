import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, notFound } from '../lib/utils';
import { getDb } from '../db';
import { 
  bpmDiagrams, bpmProcesses, rcms, rcmControls, controls, bpmNodeRcms,
  organization, auditLogs
} from '../db/schema';
import { eq, and, inArray, sql, ne, SQL } from 'drizzle-orm';
import type { BPMProcess } from "@shared/types";

const bpm = new Hono<HonoEnv>();

// --- BPM Diagram Routes ---

bpm.get('/bpm-diagrams', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const year = c.req.query('year');

  let conditions: SQL = eq(bpmDiagrams.organizationId, orgId);
  if (year) {
    conditions = and(conditions, eq(bpmDiagrams.year, parseInt(year))) as SQL;
  }

  const items = await db.select().from(bpmDiagrams).where(conditions);
  return ok(c, { items });
});

bpm.get('/bpm-diagrams/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const diags = await db.select().from(bpmDiagrams).where(and(eq(bpmDiagrams.id, id), eq(bpmDiagrams.organizationId, orgId))).limit(1);
  if (diags.length === 0) return notFound(c);
  
  const diag = diags[0];
  const nodes = (diag.nodes as any[]) || [];

  const hydratedNodes = await Promise.all(nodes.map(async (node: any) => {
    if (node.type === 'activity' || node.type === 'automated-activity') {
      const mappings = await db.select({
        risk: rcms,
        map: rcmControls
      })
      .from(bpmNodeRcms)
      .innerJoin(rcms, eq(bpmNodeRcms.rcmId, rcms.id))
      .leftJoin(rcmControls, eq(rcms.id, rcmControls.rcmId))
      .where(and(
        eq(bpmNodeRcms.diagramId, id),
        eq(bpmNodeRcms.nodeId, node.id)
      ));

      const regulatoryPairs = mappings.map((m: any) => ({
        riskId: m.risk.id,
        riskDescription: m.risk.riskDescription,
        isFraudRelated: m.risk.isFraudRelated,
        riskRating: m.risk.riskRating,
        controlId: m.map?.controlId || 'C-TBD',
        controlDescription: m.map?.controlDescription || '',
        isKeyControl: m.map?.isKeyControl || false,
        classification: m.map?.controlType || 'TLC',
        ipoC: m.map?.ipoC,
        ipoA: m.map?.ipoA,
        ipoV: m.map?.ipoV,
        ipoRa: m.map?.ipoRa,
        cosoPrinciples: m.map?.cosoPrinciples,
        itgcDomain: m.map?.itgcDomain,
        itgcAssertions: m.map?.itgcAssertions,
      }));

      return {
        ...node,
        data: {
          ...node.data,
          regulatoryPairs
        }
      };
    }
    return node;
  }));

  return ok(c, {
    ...diag,
    nodes: hydratedNodes
  });
});

bpm.post('/bpm-diagrams', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<any>();
  const id = crypto.randomUUID();
  
  const yearValue = body.year ? parseInt(body.year.toString()) : null;

  const newDiagram = {
    id,
    organizationId: orgId,
    name: body.name || "New Diagram",
    subProcess: body.subProcess,
    year: yearValue,
    nodes: body.nodes || [],
    edges: body.edges || [],
    createdAt: new Date(),
    createdBy: userId,
  };
  await db.insert(bpmDiagrams).values(newDiagram);
  return ok(c, newDiagram);
});

bpm.put('/bpm-diagrams/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const body = await c.req.json<any>();

  const yearValue = body.year ? parseInt(body.year.toString()) : undefined;

  await db.update(bpmDiagrams)
    .set({
      name: body.name,
      year: yearValue,
      subProcess: body.subProcess,
      nodes: body.nodes,
      edges: body.edges,
      updatedAt: new Date(),
    })
    .where(and(eq(bpmDiagrams.id, id), eq(bpmDiagrams.organizationId, orgId)));

  const matchedProcesses = await db.select().from(bpmProcesses)
    .where(and(
      eq(bpmProcesses.organizationId, orgId),
      sql`TRIM(LOWER(${bpmProcesses.name})) = TRIM(LOWER(${body.subProcess}))`
    )).limit(1);
  
  const bpmProcessId = matchedProcesses.length > 0 ? matchedProcesses[0].id : null;
  const noGL = matchedProcesses.length > 0 ? matchedProcesses[0].noGL : null;

  await db.delete(bpmNodeRcms).where(eq(bpmNodeRcms.diagramId, id));

  const nodes = body.nodes || [];
  const edges = body.edges || [];
  const activeRiskControlPairs = new Set<string>();
  const activeRiskIdsInDiagram = new Set<string>();
  const activeControlIdsInDiagram = new Set<string>();

  for (const node of nodes) {
    const insertedRiskIdsForNode = new Set<string>();
    const nodePairs = node.data?.regulatoryPairs || 
                     (node.data?.regulatoryData ? [node.data.regulatoryData] : []);

    if ((node.type === 'activity' || node.type === 'automated-activity') && nodePairs.length > 0) {
      for (const reg of nodePairs) {
        if (reg.riskId) activeRiskIdsInDiagram.add(reg.riskId);
        if (reg.controlId) activeControlIdsInDiagram.add(reg.controlId);
        
        const riskId = reg.riskId;
        const ctrlId = reg.controlId;

        if (riskId && ctrlId) {
          activeRiskControlPairs.add(`${riskId}:${ctrlId}`);
          
          const existingRisk = await db.select().from(rcms).where(and(eq(rcms.id, riskId), eq(rcms.organizationId, orgId))).limit(1);
          if (existingRisk.length === 0) {
            await db.insert(rcms).values({
              id: riskId,
              organizationId: orgId,
              process: body.name || "Default Process",
              subProcess: body.subProcess || "Default Sub Process",
              riskDescription: reg.riskDescription || "Draft Risk",
              isFraudRelated: reg.isFraudRelated || false,
              riskRating: reg.riskRating || "Low",
              status: "Draft",
              diagramId: id
            });
          } else {
            await db.update(rcms).set({
              riskDescription: reg.riskDescription,
              isFraudRelated: reg.isFraudRelated,
              riskRating: reg.riskRating,
            }).where(eq(rcms.id, riskId));
          }

          const existingCtrl = await db.select().from(controls).where(and(eq(controls.id, ctrlId), eq(controls.organizationId, orgId))).limit(1);
          if (existingCtrl.length === 0) {
            await db.insert(controls).values({
              id: ctrlId,
              organizationId: orgId,
              code: ctrlId,
              name: reg.controlDescription || node.data.label || "Draft Control",
              rcmId: riskId,
              level: reg.classification || 'TLC',
              cosoPrinciples: reg.cosoPrinciples || [],
              bpmProcessId: bpmProcessId,
              fsliCodes: noGL ? [noGL] : [],
              businessProcess: body.name,
              subProcess: body.subProcess,
            });
          } else {
            await db.update(controls).set({
              name: reg.controlDescription || node.data.label,
              level: reg.classification || 'TLC',
              cosoPrinciples: reg.cosoPrinciples || [],
              bpmProcessId: bpmProcessId,
              businessProcess: body.name,
              subProcess: body.subProcess,
              ...(noGL ? { fsliCodes: [noGL] } : {})
            }).where(eq(controls.id, ctrlId));
          }

          const existingMap = await db.select().from(rcmControls).where(and(
            eq(rcmControls.rcmId, riskId),
            eq(rcmControls.controlId, ctrlId),
            eq(rcmControls.organizationId, orgId)
          )).limit(1);

          const mapValues = {
            controlName: reg.controlDescription || node.data.label,
            controlDescription: reg.controlDescription,
            isKeyControl: reg.isKeyControl,
            ipoC: reg.ipoC,
            ipoA: reg.ipoA,
            ipoV: reg.ipoV,
            ipoRa: reg.ipoRa,
            cosoPrinciples: reg.cosoPrinciples,
            itgcDomain: reg.itgcDomain,
            itgcAssertions: reg.itgcAssertions,
            controlType: reg.classification === 'ELC' ? 'ELC' : 'TLC',
          };

          if (existingMap.length === 0) {
            await db.insert(rcmControls).values({
              id: crypto.randomUUID(),
              organizationId: orgId,
              rcmId: riskId,
              controlId: ctrlId,
              ...mapValues
            });
          } else {
            await db.update(rcmControls).set(mapValues).where(eq(rcmControls.id, existingMap[0].id));
          }

          if (!insertedRiskIdsForNode.has(riskId)) {
            await db.insert(bpmNodeRcms).values({
              id: crypto.randomUUID(),
              organizationId: orgId,
              diagramId: id,
              nodeId: node.id,
              rcmId: riskId
            });
            insertedRiskIdsForNode.add(riskId);
          }
        }
      }
    }

    if ((node.type === 'activity' || node.type === 'automated-activity') && node.data?.risks && !node.data?.regulatoryPairs && !node.data?.regulatoryData) {
      for (const riskEntry of node.data.risks) {
        if (!insertedRiskIdsForNode.has(riskEntry.rcmId)) {
          await db.insert(bpmNodeRcms).values({
            id: crypto.randomUUID(),
            organizationId: orgId,
            diagramId: id,
            nodeId: node.id,
            rcmId: riskEntry.rcmId
          });
          insertedRiskIdsForNode.add(riskEntry.rcmId);
        }

        if (riskEntry.controlIds) {
          riskEntry.controlIds.forEach((ctrlId: string) => activeRiskControlPairs.add(`${riskEntry.rcmId}:${ctrlId}`));
        }
      }
    }
  }

  for (const edge of edges) {
    const sourceNode = nodes.find((n: any) => n.id === edge.source);
    const targetNode = nodes.find((n: any) => n.id === edge.target);

    if (sourceNode?.type === 'risk' && targetNode?.type === 'control') {
      const rcmId = sourceNode.data?.rcmId;
      const ctrlId = targetNode.data?.controlId;
      if (rcmId && ctrlId) activeRiskControlPairs.add(`${rcmId}:${ctrlId}`);
    }
  }

  for (const pair of activeRiskControlPairs) {
    const [rcmId, ctrlId] = pair.split(':');
    const existing = await db.select().from(rcmControls).where(and(
      eq(rcmControls.rcmId, rcmId),
      eq(rcmControls.controlId, ctrlId),
      eq(rcmControls.organizationId, orgId)
    )).limit(1);

    if (existing.length === 0) {
      await db.insert(rcmControls).values({
        id: crypto.randomUUID(),
        organizationId: orgId,
        rcmId,
        controlId: ctrlId
      });
    }
  }

  if (activeRiskIdsInDiagram.size > 0) {
    for (const rcmId of activeRiskIdsInDiagram) {
      const activeCtrlsForThisRisk = Array.from(activeRiskControlPairs)
        .filter(p => p.startsWith(`${rcmId}:`))
        .map(p => p.split(':')[1]);

      if (activeCtrlsForThisRisk.length > 0) {
        await db.execute(sql`
          DELETE FROM rcm_controls
          WHERE organization_id = ${orgId}
          AND rcm_id = ${rcmId}
          AND control_id NOT IN (${sql.join(activeCtrlsForThisRisk.map(id => sql`${id}`), sql`, `)})
        `);
      } else {
        await db.delete(rcmControls).where(and(
          eq(rcmControls.rcmId, rcmId),
          eq(rcmControls.organizationId, orgId)
        ));
      }
    }
  }

  if (activeControlIdsInDiagram.size > 0) {
    const orphanCheckResult = await db.execute(sql`
      SELECT id FROM controls 
      WHERE organization_id = ${orgId} 
      AND id IN (${sql.join(Array.from(activeControlIdsInDiagram).map(id => sql`${id}`), sql`, `)})
      AND NOT EXISTS (
        SELECT 1 FROM rcm_controls 
        WHERE rcm_controls.control_id = controls.id 
        AND rcm_controls.organization_id = ${orgId}
      )
    `);

    const orphanIds = (orphanCheckResult.rows || orphanCheckResult).map((r: any) => r.id);

    if (orphanIds.length > 0) {
      const ids = orphanIds.map((id: any) => sql`${id}`);
      await db.execute(sql`DELETE FROM csa_samples WHERE csa_record_id IN (SELECT id FROM csa_records WHERE control_id IN (${sql.join(ids, sql`, `)}))`);
      await db.execute(sql`DELETE FROM deficiencies WHERE control_id IN (${sql.join(ids, sql`, `)})`);
      await db.execute(sql`DELETE FROM csa_records WHERE control_id IN (${sql.join(ids, sql`, `)})`);
      await db.execute(sql`DELETE FROM test_records WHERE control_id IN (${sql.join(ids, sql`, `)})`);
      await db.execute(sql`DELETE FROM controls WHERE id IN (${sql.join(ids, sql`, `)})`);
    }
  }

  const risksOfThisDiagram = await db.select({ id: rcms.id }).from(rcms).where(eq(rcms.diagramId, id));
  const riskIdsOfThisDiagram = risksOfThisDiagram.map((r: any) => r.id);
  
  for (const drId of riskIdsOfThisDiagram) {
     if (!activeRiskIdsInDiagram.has(drId) && drId.startsWith('R-')) {
        await db.delete(rcms).where(and(eq(rcms.id, drId), eq(rcms.organizationId, orgId)));
     }
  }

  const linkedRisks = await db.select({ id: bpmNodeRcms.rcmId })
    .from(bpmNodeRcms)
    .where(eq(bpmNodeRcms.diagramId, id))
    .groupBy(bpmNodeRcms.rcmId);
  
  const riskCount = linkedRisks.length;
  const uniqueRiskIds = linkedRisks.map((r: any) => r.id);
  
  let controlCount = 0;
  if (uniqueRiskIds.length > 0) {
    const linkedCtrls = await db.select({ id: rcmControls.controlId })
      .from(rcmControls)
      .where(and(
        inArray(rcmControls.rcmId, uniqueRiskIds),
        eq(rcmControls.organizationId, orgId)
      ))
      .groupBy(rcmControls.controlId);
    controlCount = linkedCtrls.length;
  }

  const diagResult = await db.select().from(bpmDiagrams).where(eq(bpmDiagrams.id, id)).limit(1);
  if (diagResult.length > 0 && diagResult[0].subProcess) {
    await db.update(bpmProcesses)
      .set({ riskCount, controlCount })
      .where(and(
        eq(bpmProcesses.organizationId, orgId),
        eq(bpmProcesses.name, diagResult[0].subProcess)
      ));
  }

  return ok(c, { success: true });
});

bpm.delete('/bpm-diagrams/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  await db.delete(bpmDiagrams).where(and(eq(bpmDiagrams.id, id), eq(bpmDiagrams.organizationId, orgId)));
  return ok(c, { success: true });
});

// --- BPM Process Routes ---

bpm.get('/bpm-processes', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const noGL = c.req.query('noGL');
  const id = c.req.query('id');

  let conditions = eq(bpmProcesses.organizationId, orgId);
  
  if (id) {
    conditions = and(conditions, eq(bpmProcesses.id, id)) as SQL;
  }
  
  if (noGL) {
    conditions = and(conditions, eq(bpmProcesses.noGL, noGL)) as SQL;
  }

  const items = await db.select({
    id: bpmProcesses.id,
    organizationId: bpmProcesses.organizationId,
    noGL: bpmProcesses.noGL,
    fsliName: bpmProcesses.fsliName,
    name: bpmProcesses.name,
    createdAt: bpmProcesses.createdAt,
    createdBy: bpmProcesses.createdBy,
    controlCount: bpmProcesses.controlCount,
    riskCount: bpmProcesses.riskCount,
    bpmCode: bpmProcesses.bpmCode,
    standardTestProcedure: bpmProcesses.standardTestProcedure
  })
  .from(bpmProcesses)
  .where(conditions);

  return ok(c, { items });
});

bpm.post('/bpm-processes', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<Partial<BPMProcess>>();
  
  const id = crypto.randomUUID();
  const newProcess = {
    id,
    organizationId: orgId,
    noGL: body.noGL || "",
    fsliName: body.fsliName || "",
    name: body.name || "New Process",
    createdAt: new Date(),
    createdBy: userId,
  };

  await db.insert(bpmProcesses).values(newProcess);

  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    organizationId: orgId,
    userId: userId,
    action: 'CREATE',
    entityType: 'BPMProcess',
    entityId: id,
    descriptionAfter: `Created BPM Process: ${newProcess.name}`,
    dataAfter: newProcess,
  });

  return ok(c, newProcess);
});

bpm.patch('/bpm-processes/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const body = await c.req.json<Partial<BPMProcess>>();

  const updateData: any = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.bpmCode !== undefined) updateData.bpmCode = body.bpmCode.trim().toUpperCase();
  if (body.fsliName !== undefined) updateData.fsliName = body.fsliName;
  if (body.standardTestProcedure !== undefined) updateData.standardTestProcedure = body.standardTestProcedure;

  if (updateData.bpmCode) {
    const existing = await db.select()
      .from(bpmProcesses)
      .where(and(
        eq(bpmProcesses.organizationId, orgId),
        eq(bpmProcesses.bpmCode, updateData.bpmCode),
        ne(bpmProcesses.id, id)
      ))
      .limit(1);
    
    if (existing.length > 0) {
      return bad(c, `BPM Code '${updateData.bpmCode}' sudah digunakan oleh proses lain.`);
    }
  }

  if (Object.keys(updateData).length > 0) {
    await db.update(bpmProcesses)
      .set(updateData)
      .where(and(eq(bpmProcesses.id, id), eq(bpmProcesses.organizationId, orgId)));
  }

  return ok(c, { success: true });
});

bpm.delete('/bpm-processes/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');

  await db.delete(bpmProcesses).where(and(eq(bpmProcesses.id, id), eq(bpmProcesses.organizationId, orgId)));
  return ok(c, { success: true });
});

export default bpm;
