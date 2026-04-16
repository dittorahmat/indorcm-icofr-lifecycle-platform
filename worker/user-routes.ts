import { Hono } from "hono";
import type { HonoEnv } from './index';
import { ok, bad, notFound } from './lib/utils';
import { getDb } from './db';
import { rcms, auditLogs, controls, simulations, glSnapshots, glRows, user, deficiencies, actionPlans, departments, bpmProcesses, csaRecords, applications, member, account, session, bpmDiagrams, bpmNodeRcms, rcmControls } from './db/schema';
import { eq, and, desc, sql, ilike } from 'drizzle-orm';
import type { 
  Control, RCM, CSARecord, TestRecord, Deficiency, ActionPlan, 
  UserRole, UserLevel, Materiality, Scoping, ChangeLog, SOCReport, Application, 
  BUMNCluster, RiskLibrary, Settings, User, GLSnapshot, MaterialitySimulation, 
  SimulationStatus, BenchmarkBasis, BPMProcess, Department, BPMWorkflowStatus 
} from "@shared/types";
import { z } from "zod";
import { parseCsv, unparseCsv } from './csv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ICOFR_KNOWLEDGE_BASE } from './knowledge-base';
import { getAuth } from './auth';

export function userRoutes(app: Hono<HonoEnv>) {
  app.get('/api/auth/me', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const userId = c.get('userId');
    const orgId = c.get('organizationId');

    const currentUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    if (currentUser.length === 0) return notFound(c, 'User not found');

    return ok(c, {
      ...currentUser[0],
      organizationId: orgId
    });
  });

  app.put('/api/auth/profile', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const userId = c.get('userId');
    const body = await c.req.json<{ language: string }>();

    if (!body.language) return bad(c, 'Language is required');

    await db.update(user).set({
      language: body.language,
      updatedAt: new Date(),
    }).where(eq(user.id, userId));

    return ok(c, { success: true });
  });

  app.get('/api/dev/fix-db', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    try {
      await db.execute(sql`ALTER TABLE simulations ADD COLUMN IF NOT EXISTS significant_accounts jsonb;`);
      await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'en';`);
      return ok(c, { message: "Database fixed! Columns significant_accounts and language added." });
    } catch (e: any) {
      return ok(c, { error: e.message });
    }
  });

  // --- User Management Routes ---

  app.get('/api/users', async (c) => {
    if (c.get('userRole') !== 'Admin') return bad(c, 'Access Denied');
    const db = getDb(c.env.DATABASE_URL);
    const search = c.req.query('search') || '';
    const page = Number(c.req.query('page')) || 1;
    const limit = Number(c.req.query('limit')) || 10;
    const offset = (page - 1) * limit;

    const whereClause = search ? ilike(user.name, `%${search}%`) : undefined;

    const [items, totalCount] = await Promise.all([
      db.select().from(user)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(user.createdAt)),
      db.select({ count: sql<number>`count(*)` }).from(user).where(whereClause)
    ]);

    return ok(c, { 
      items, 
      total: Number(totalCount[0]?.count || 0),
      page,
      limit
    });
  });

  app.post('/api/users', async (c) => {
    if (c.get('userRole') !== 'Admin') return bad(c, 'Access Denied');
    const db = getDb(c.env.DATABASE_URL);
    const auth = getAuth(c.env);
    const body = await c.req.json();

    try {
      const newUser = await auth.api.signUpEmail({
        body: {
          email: body.email,
          password: body.password || "password123",
          name: body.name,
        }
      });

      if (newUser) {
        await db.update(user).set({
          role: body.role || 'Line 1',
          level: body.level || 'Staff',
          departmentId: body.departmentId,
        }).where(eq(user.id, newUser.user.id));

        return ok(c, newUser.user);
      }
    } catch (e: any) {
      return bad(c, e.message);
    }
  });

  app.put('/api/users/:id', async (c) => {
    if (c.get('userRole') !== 'Admin') return bad(c, 'Access Denied');
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);
    const body = await c.req.json();

    await db.update(user).set({
      name: body.name,
      role: body.role,
      level: body.level,
      departmentId: body.departmentId,
      updatedAt: new Date(),
    }).where(eq(user.id, id));

    return ok(c, { success: true });
  });

  app.delete('/api/users/:id', async (c) => {
    if (c.get('userRole') !== 'Admin') return bad(c, 'Access Denied');
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);

    // Better Auth cleanup if needed, but for now we delete from our DB
    await db.delete(user).where(eq(user.id, id));
    await db.delete(schema.member).where(eq(schema.member.userId, id));
    await db.delete(schema.account).where(eq(schema.account.userId, id));
    await db.delete(schema.session).where(eq(schema.session.userId, id));

    return ok(c, { success: true });
  });

  app.get('/api/departments', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    
    // Join with user table to get counts per department
    const items = await db.select({
      id: departments.id,
      name: departments.name,
      organizationId: departments.organizationId,
      userCount: sql<number>`count(${user.id})`
    })
    .from(departments)
    .leftJoin(user, eq(user.departmentId, departments.id))
    .where(eq(departments.organizationId, orgId))
    .groupBy(departments.id);

    return ok(c, { items });
  });

  app.post('/api/departments', async (c) => {
    if (c.get('userRole') !== 'Admin') return bad(c, 'Access Denied');
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const newDept = { id, organizationId: orgId, name: body.name };
    await db.insert(departments).values(newDept);
    return ok(c, newDept);
  });

  app.put('/api/departments/:id', async (c) => {
    if (c.get('userRole') !== 'Admin') return bad(c, 'Access Denied');
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);
    const body = await c.req.json();
    await db.update(departments).set({ name: body.name }).where(eq(departments.id, id));
    return ok(c, { success: true });
  });

  app.delete('/api/departments/:id', async (c) => {
    if (c.get('userRole') !== 'Admin') return bad(c, 'Access Denied');
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);
    await db.delete(departments).where(eq(departments.id, id));
    return ok(c, { success: true });
  });

  // --- Deficiencies & Action Plans ---

  app.get('/api/deficiencies', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(deficiencies).where(eq(deficiencies.organizationId, orgId));
    return ok(c, { items });
  });

  app.get('/api/actionplans', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(actionPlans).where(eq(actionPlans.organizationId, orgId));
    return ok(c, { items });
  });

  // --- ICOFR Routes (RCM Refactored) ---
  
  app.get('/api/rcm', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(rcms).where(eq(rcms.organizationId, orgId));
    return ok(c, { items });
  });

  app.post('/api/rcm', async (c) => {
    const role = c.get('userRole');
    if (role !== 'Line 2' && role !== 'Admin') return bad(c, 'Access Denied');
    
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const body = await c.req.json<Partial<RCM>>();
    
    const id = crypto.randomUUID();
    const newRcm = {
      id,
      organizationId: orgId,
      process: body.process || "New Process",
      subProcess: body.subProcess || "New Sub-Process",
      riskDescription: body.riskDescription || "New Risk",
      status: "Draft",
    };

    await db.insert(rcms).values(newRcm);

    // System Audit Log
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId: userId,
      action: 'CREATE',
      entityType: 'RCM',
      entityId: id,
      descriptionAfter: `Created RCM: ${newRcm.process}`,
      dataAfter: newRcm,
    });

    return ok(c, newRcm);
  });

  app.put('/api/rcm/:id', async (c) => {
    const role = c.get('userRole');
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const body = await c.req.json<Partial<RCM>>();
    const db = getDb(c.env.DATABASE_URL);

    const existing = await db.select().from(rcms).where(and(eq(rcms.id, id), eq(rcms.organizationId, orgId)));
    if (existing.length === 0) return notFound(c, 'RCM not found');

    if (role === 'Line 1') {
      // Logic request change (simplified for now)
      await db.update(rcms).set({ status: 'Pending Change Approval' }).where(eq(rcms.id, id));
      return ok(c, { message: "Change request submitted" });
    }

    if (role !== 'Line 2') return bad(c, 'Access Denied');

    await db.update(rcms).set(body).where(eq(rcms.id, id));

    // Audit Log
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId: userId,
      action: 'UPDATE',
      entityType: 'RCM',
      entityId: id,
      descriptionAfter: "Updated RCM details",
      dataBefore: existing[0],
      dataAfter: { ...existing[0], ...body },
    });

    return ok(c, { success: true });
  });

  app.delete('/api/rcm/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const id = c.req.param('id');

    // We allow permanent deletion because the frontend shows a warning
    // and the relational links will be deleted via ON DELETE CASCADE.
    await db.delete(rcms).where(and(eq(rcms.id, id), eq(rcms.organizationId, orgId)));
    return ok(c, { success: true });
  });

  // --- Controls Refactored ---

  app.get('/api/controls', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(controls).where(eq(controls.organizationId, orgId));
    return ok(c, { items });
  });

  app.post('/api/controls', async (c) => {
    const role = c.get('userRole');
    if (role !== 'Line 2' && role !== 'Admin') return bad(c, 'Access Denied');
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const body = await c.req.json<Partial<Control>>();
    const id = crypto.randomUUID();
    const newControl = {
      id,
      organizationId: orgId,
      rcmId: body.rcmId,
      code: body.code || "CTRL-NEW",
      name: body.name || "New Control",
      description: body.description,
      ownerId: body.ownerId || userId,
      type: body.type || "Preventive",
      nature: body.nature || "Manual",
      frequency: body.frequency || "Monthly",
      bpmStatus: "Approved",
      // New worksheet fields
      fsliCodes: body.fsliCodes || [],
      businessProcessLvl1: body.businessProcessLvl1,
      businessProcessLvl2: body.businessProcessLvl2,
      subProcess: body.subProcess,
      location: body.location,
      isFraudRelated: body.isFraudRelated || false,
      isKeyControl: body.isKeyControl || false,
      ipo: body.ipo || [],
      assertions: body.assertions || [],
      supportingDocs: body.supportingDocs,
      reference: body.reference,
      applicationId: body.applicationId,
    };
    await db.insert(controls).values(newControl);
    return ok(c, newControl);
  });

  app.post('/api/controls/:id/approve', async (c) => {
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const userLevel = c.get('userLevel');
    const db = getDb(c.env.DATABASE_URL);
    if (userLevel !== 'Manager' && c.get('userRole') !== 'Admin') return bad(c, "Only Managers can approve changes");
    await db.update(controls).set({ bpmStatus: 'Approved' }).where(and(eq(controls.id, id), eq(controls.organizationId, orgId)));
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(), organizationId: orgId, userId: userId,
      action: 'APPROVE_CHANGE', entityType: 'Control', entityId: id,
      descriptionAfter: "Updated & Approved via Workflow",
      isRegulatory: true, effectiveDate: new Date(), approvedBy: userId
    });
    return ok(c, { success: true });
  });

  // BPM Control Spreadsheet Update with Auto-Log (Lampiran 6)
  app.put('/api/controls/:id/bpm-update', async (c) => {
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const userRole = c.get('userRole');
    const userLevel = c.get('userLevel');
    const userDeptId = c.get('departmentId');
    
    const db = getDb(c.env.DATABASE_URL);
    const body = await c.req.json<Partial<Control>>();

    const existing = await db.select().from(controls).where(and(eq(controls.id, id), eq(controls.organizationId, orgId)));
    if (existing.length === 0) return notFound(c, 'Control not found');

    const oldState = existing[0];

    // Validation: Lini 1 can only edit if department matches
    if (userRole === 'Line 1' && oldState.departmentId && oldState.departmentId !== userDeptId) {
      return bad(c, "Access Denied: Control belongs to another department");
    }

    // Set status based on level
    const nextStatus: BPMWorkflowStatus = (userRole === 'Line 1' && userLevel === 'Staff') ? 'Draft' : 'Approved';

    await db.update(controls).set({
      ...body,
      bpmStatus: nextStatus,
    }).where(eq(controls.id, id));

    // Audit Log
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId: userId,
      action: 'UPDATE_BPM',
      entityType: 'Control',
      entityId: id,
      descriptionAfter: `Updated BPM Worksheet. Status: ${nextStatus}`,
      dataBefore: oldState,
      dataAfter: { ...oldState, ...body, bpmStatus: nextStatus }
    });

    return ok(c, { success: true, status: nextStatus });
  });

  // --- Simulations Refactored ---

  app.get('/api/simulations', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(simulations).where(eq(simulations.organizationId, orgId));
    return ok(c, { items });
  });

  app.post('/api/simulations', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const body = await c.req.json<Partial<MaterialitySimulation>>();
    const id = crypto.randomUUID();
    const newSim = {
      id, organizationId: orgId,
      name: body.name || "New Simulation",
      year: body.year || new Date().getFullYear(),
      status: "Draft" as any,
      omValue: body.omValue || 0,
      pmValue: body.pmValue || 0,
      glSnapshotId: body.glSnapshotId,
      locationCount: body.locationCount || 1,
      omPercentage: body.omPercentage ?? 5,
      haircutPercentage: body.haircutPercentage ?? 25,
      basis: body.basis || "Revenue",
      createdAt: new Date(),
      createdBy: userId,
    };
    await db.insert(simulations).values(newSim);
    return ok(c, newSim);
  });

  app.put('/api/simulations/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const body = await c.req.json<Partial<MaterialitySimulation>>();
    
    // Explicitly pick fields to update to avoid metadata/type mismatches
    await db.update(simulations)
      .set({
        name: body.name,
        basis: body.basis,
        omPercentage: body.omPercentage,
        haircutPercentage: body.haircutPercentage,
        locationCount: body.locationCount,
        omValue: body.omValue,
        pmValue: body.pmValue,
        significantAccounts: body.significantAccounts,
        assessmentData: body.assessmentData,
        updatedAt: new Date(),
      })
      .where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));
    
    return ok(c, { success: true });
  });

  app.post('/api/simulations/:id/submit', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const body = await c.req.json<Partial<MaterialitySimulation>>();
    
    await db.update(simulations)
      .set({ 
        status: 'Pending CFO', 
        updatedAt: new Date(),
        omValue: body.omValue,
        pmValue: body.pmValue,
        significantAccounts: body.significantAccounts
      })
      .where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));
      
    const updated = await db.select().from(simulations).where(eq(simulations.id, id)).limit(1);
    return ok(c, updated[0]);
  });

  app.post('/api/scoping/assign-department', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const body = await c.req.json<{ scopingId: string, accountName: string, departmentId: string }>();

    // 1. Find the simulation to get the snapshot ID
    const [sim] = await db.select()
      .from(simulations)
      .where(and(
        eq(simulations.id, body.scopingId),
        eq(simulations.organizationId, orgId)
      ))
      .limit(1);

    if (!sim) return notFound(c, 'Simulation not found');
    if (!sim.glSnapshotId) return bad(c, 'Simulation has no associated snapshot');

    // 2. Update all rows with this account number in that snapshot
    // Frontend sends noGL as accountName
    await db.update(glRows)
      .set({ assignedDepartmentId: body.departmentId })
      .where(and(
        eq(glRows.snapshotId, sim.glSnapshotId),
        eq(glRows.noGL, body.accountName),
        eq(glRows.organizationId, orgId)
      ));

    // 3. Log the action
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId: c.get('userId'),
      action: 'ASSIGN_DEPARTMENT',
      entityType: 'GL_Account',
      entityId: `${sim.glSnapshotId}:${body.accountName}`,
      descriptionAfter: `Assigned department ${body.departmentId} to account ${body.accountName}`,
      dataAfter: body
    });

    return ok(c, { success: true });
  });

  app.delete('/api/simulations/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    
    await db.delete(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));
    return ok(c, { success: true });
  });

  // --- BPM Diagram Routes ---

  app.get('/api/bpm-diagrams', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(bpmDiagrams).where(eq(bpmDiagrams.organizationId, orgId));
    return ok(c, { items });
  });

  app.get('/api/bpm-diagrams/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const diags = await db.select().from(bpmDiagrams).where(and(eq(bpmDiagrams.id, id), eq(bpmDiagrams.organizationId, orgId))).limit(1);
    if (diags.length === 0) return notFound(c);
    
    const diag = diags[0];
    const nodes = diag.nodes || [];

    // Hydrate Activity nodes with risks/controls from junction tables
    const hydratedNodes = await Promise.all(nodes.map(async (node: any) => {
      if (node.type === 'activity' || node.type === 'automated-activity') {
        // Fetch risks linked to this node
        const nodeRisks = await db.select().from(bpmNodeRcms).where(and(
          eq(bpmNodeRcms.diagramId, id),
          eq(bpmNodeRcms.nodeId, node.id)
        ));

        const risks = await Promise.all(nodeRisks.map(async (nr) => {
          // Fetch controls linked to each risk
          const riskControls = await db.select().from(rcmControls).where(eq(rcmControls.rcmId, nr.rcmId));
          return {
            rcmId: nr.rcmId,
            controlIds: riskControls.map(rc => rc.controlId)
          };
        }));

        return {
          ...node,
          data: {
            ...node.data,
            risks
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

  app.post('/api/bpm-diagrams', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const body = await c.req.json<any>();
    const id = crypto.randomUUID();
    const newDiagram = {
      id,
      organizationId: orgId,
      name: body.name || "New Diagram",
      subProcess: body.subProcess,
      nodes: body.nodes || [],
      edges: body.edges || [],
      createdAt: new Date(),
      createdBy: userId,
    };
    await db.insert(bpmDiagrams).values(newDiagram);
    return ok(c, newDiagram);
  });

  app.put('/api/bpm-diagrams/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const body = await c.req.json<any>();

    // 1. Update the diagram layout (JSON)
    await db.update(bpmDiagrams)
      .set({
        name: body.name,
        nodes: body.nodes,
        edges: body.edges,
        updatedAt: new Date(),
      })
      .where(and(eq(bpmDiagrams.id, id), eq(bpmDiagrams.organizationId, orgId)));

    // 2. Sync Relational Tables (Transaction-like)
    // First, clear existing links for this diagram
    await db.delete(bpmNodeRcms).where(eq(bpmNodeRcms.diagramId, id));

    // Extract links from nodes
    const nodes = body.nodes || [];
    for (const node of nodes) {
      if ((node.type === 'activity' || node.type === 'automated-activity') && node.data?.risks) {
        for (const riskEntry of node.data.risks) {
          // riskEntry = { rcmId: string, controlIds: string[] }
          
          // Link Activity Node -> Risk
          await db.insert(bpmNodeRcms).values({
            id: crypto.randomUUID(),
            organizationId: orgId,
            diagramId: id,
            nodeId: node.id,
            rcmId: riskEntry.rcmId
          });

          // Link Risk -> Controls
          if (riskEntry.controlIds && riskEntry.controlIds.length > 0) {
            for (const ctrlId of riskEntry.controlIds) {
              // Check if link already exists to avoid unique constraint violations
              const existing = await db.select().from(rcmControls).where(and(
                eq(rcmControls.rcmId, riskEntry.rcmId),
                eq(rcmControls.controlId, ctrlId),
                eq(rcmControls.organizationId, orgId)
              ));
              
              if (existing.length === 0) {
                await db.insert(rcmControls).values({
                  id: crypto.randomUUID(),
                  organizationId: orgId,
                  rcmId: riskEntry.rcmId,
                  controlId: ctrlId
                });
              }
            }
          }
        }
      }
    }

    return ok(c, { success: true });
  });

  app.delete('/api/bpm-diagrams/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    await db.delete(bpmDiagrams).where(and(eq(bpmDiagrams.id, id), eq(bpmDiagrams.organizationId, orgId)));
    return ok(c, { success: true });
  });

  // --- BPM Process Routes ---

  app.get('/api/bpm-processes', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const noGL = c.req.query('noGL');

    if (noGL) {
      const items = await db.select().from(bpmProcesses)
        .where(and(
          eq(bpmProcesses.organizationId, orgId),
          eq(bpmProcesses.noGL, noGL)
        ));
      return ok(c, { items });
    }

    const items = await db.select().from(bpmProcesses).where(eq(bpmProcesses.organizationId, orgId));
    return ok(c, { items });
  });

  app.post('/api/bpm-processes', async (c) => {
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

    // Audit Log
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

  app.delete('/api/bpm-processes/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');

    await db.delete(bpmProcesses).where(and(eq(bpmProcesses.id, id), eq(bpmProcesses.organizationId, orgId)));
    return ok(c, { success: true });
  });

  // --- Applications Routes ---

  app.get('/api/applications', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(applications).where(eq(applications.organizationId, orgId));
    return ok(c, { items });
  });

  app.post('/api/applications', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const body = await c.req.json<Partial<Application>>();
    const id = crypto.randomUUID();
    const newApp = {
      id,
      organizationId: orgId,
      name: body.name || "New Application",
      description: body.description || "",
      statusItgc: (body as any).statusItgc || "Not Tested",
      criticality: body.criticality || "Medium",
    };
    await db.insert(applications).values(newApp);
    return ok(c, newApp);
  });

  app.put('/api/applications/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const body = await c.req.json<Partial<Application>>();
    await db.update(applications)
      .set({
        name: body.name,
        description: body.description,
        statusItgc: (body as any).statusItgc,
        criticality: body.criticality,
      })
      .where(and(eq(applications.id, id), eq(applications.organizationId, orgId)));
    return ok(c, { success: true });
  });

  app.delete('/api/applications/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    await db.delete(applications).where(and(eq(applications.id, id), eq(applications.organizationId, orgId)));
    return ok(c, { success: true });
  });

  // --- GL Snapshots Refactored ---

  app.get('/api/gl-snapshots', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    
    // Get snapshots with pre-calculated row counts
    const items = await db.select({
      id: glSnapshots.id,
      organizationId: glSnapshots.organizationId,
      filename: glSnapshots.filename,
      uploadDate: glSnapshots.uploadDate,
      status: glSnapshots.status,
      isActive: glSnapshots.isActive,
      benchmarkFsliNames: glSnapshots.benchmarkFsliNames,
      rowCount: sql<number>`count(${glRows.id})`
    })
    .from(glSnapshots)
    .leftJoin(glRows, eq(glRows.snapshotId, glSnapshots.id))
    .where(eq(glSnapshots.organizationId, orgId))
    .groupBy(glSnapshots.id)
    .orderBy(desc(glSnapshots.uploadDate));

    return ok(c, { items });
  });

  app.post('/api/gl-snapshots', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const body = await c.req.json<{ filename: string, rows?: any[], fileContent?: string }>();
    
    // 1. Create Snapshot Record
    const snapshotId = crypto.randomUUID();
    const newSnapshot = {
      id: snapshotId,
      organizationId: orgId,
      filename: body.filename || "upload.csv",
      uploadDate: new Date(),
      status: "Draft",
      isActive: false,
    };

    await db.insert(glSnapshots).values(newSnapshot);

    // Auto-set active if it's the first snapshot for this organization
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(glSnapshots).where(eq(glSnapshots.organizationId, orgId));
    if (Number(countResult[0]?.count || 0) <= 1) {
      await db.update(glSnapshots).set({ isActive: true }).where(eq(glSnapshots.id, snapshotId));
    }

    let rowsToInsert: any[] = [];

    // 2. Handle either direct rows (current frontend) or fileContent (agnostic server)
    if (body.rows && Array.isArray(body.rows)) {
      rowsToInsert = body.rows.map((row: any) => ({
        id: crypto.randomUUID(),
        snapshotId: snapshotId,
        organizationId: orgId,
        ymd: row.ymd,
        entityCode: row.entityCode,
        noGL: row.noGL,
        glDesc: row.glDesc,
        currency: row.currency,
        balance: row.balance,
        fsliCode: row.fsliCode,
        fsliName: row.fsliName,
        category: row.kategori,
        subKategori: row.subKategori,
      }));
    } else if (body.fileContent) {
      const parsed = parseCsv<any>(body.fileContent, { header: true, delimiter: ';' });
      rowsToInsert = parsed.data.map((row: any) => ({
        id: crypto.randomUUID(),
        snapshotId: snapshotId,
        organizationId: orgId,
        ymd: row.YMD,
        entityCode: row.Kode_Entity,
        noGL: row.No_GL,
        glDesc: row.GL_Desc,
        currency: row.Kode_Valuta,
        balance: parseFloat(String(row.GL_Balance || '0').replace(/[(),]/g, '').trim()) * (String(row.GL_Balance).includes('(') ? -1 : 1),
        fsliCode: row.Kode_FSLI,
        fsliName: row.FSLI,
        category: row.Kategori,
        subKategori: row.Sub_Kategori,
      }));
    }

    // 3. Batch Insert Rows
    if (rowsToInsert.length > 0) {
      for (let i = 0; i < rowsToInsert.length; i += 1000) {
        await db.insert(glRows).values(rowsToInsert.slice(i, i + 1000));
      }
    }

    return ok(c, { ...newSnapshot, count: rowsToInsert.length });
  });

  app.get('/api/gl-snapshots/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');

    const snap = await db.select().from(glSnapshots).where(and(eq(glSnapshots.id, id), eq(glSnapshots.organizationId, orgId)));
    if (snap.length === 0) return notFound(c);

    const rows = await db.select().from(glRows).where(eq(glRows.snapshotId, id));

    return ok(c, { ...snap[0], rows });
  });

  app.put('/api/gl-snapshots/:id/mapping', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');
    const body = await c.req.json<{ benchmarkFsliNames: string[] }>();

    await db.update(glSnapshots).set({ 
      benchmarkFsliNames: body.benchmarkFsliNames,
      status: 'Mapped' 
    }).where(and(eq(glSnapshots.id, id), eq(glSnapshots.organizationId, orgId)));

    return ok(c, { success: true });
  });

  app.post('/api/gl-snapshots/:id/set-active', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');

    // 1. Deactivate all snapshots for this organization
    await db.update(glSnapshots)
      .set({ isActive: false })
      .where(eq(glSnapshots.organizationId, orgId));

    // 2. Activate the target snapshot
    await db.update(glSnapshots)
      .set({ isActive: true })
      .where(and(eq(glSnapshots.id, id), eq(glSnapshots.organizationId, orgId)));

    return ok(c, { success: true });
  });

  app.delete('/api/gl-snapshots/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const orgId = c.get('organizationId');

    // Cascading delete rows manually if needed, but Drizzle references can handle it if configured
    await db.delete(glRows).where(eq(glRows.snapshotId, id));
    await db.delete(glSnapshots).where(and(eq(glSnapshots.id, id), eq(glSnapshots.organizationId, orgId)));

    return ok(c, { success: true });
  });

  // Update owner acceptance for a GL account
  app.put('/api/gl-rows/:noGL/owner-acceptance', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const noGL = c.req.param('noGL');
    const body = await c.req.json<{ ownerAcceptance: "Accepted" | "Rejected" }>();

    // Get the active snapshot
    const [activeSnapshot] = await db
      .select({ id: glSnapshots.id })
      .from(glSnapshots)
      .where(and(
        eq(glSnapshots.organizationId, orgId),
        eq(glSnapshots.isActive, true)
      ))
      .limit(1);

    if (!activeSnapshot) {
      return c.json({ error: 'No active snapshot found' }, 404);
    }

    // Update the owner acceptance
    await db
      .update(glRows)
      .set({ ownerAcceptance: body.ownerAcceptance })
      .where(and(
        eq(glRows.noGL, noGL),
        eq(glRows.snapshotId, activeSnapshot.id),
        eq(glRows.organizationId, orgId)
      ));

    return ok(c, { success: true });
  });

  // --- Reporting & Aggregation Refactored ---

  app.get('/api/reports/summary', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');

    const [controlCount, rcmCount, deficiencySummary, openDeficiencies] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(controls).where(eq(controls.organizationId, orgId)),
      db.select({ count: sql<number>`count(*)` }).from(rcms).where(eq(rcms.organizationId, orgId)),
      db.select({ 
        severity: auditLogs.entityType,
        count: sql<number>`count(*)` 
      }).from(auditLogs).where(and(eq(auditLogs.organizationId, orgId), eq(auditLogs.action, 'CREATE'))).groupBy(auditLogs.entityType),
      db.select({ count: sql<number>`count(*)` }).from(deficiencies).where(and(eq(deficiencies.organizationId, orgId), eq(deficiencies.status, 'Open')))
    ]);

    return ok(c, {
      totalControls: Number(controlCount[0]?.count || 0),
      totalRcm: Number(rcmCount[0]?.count || 0),
      openDeficiencies: Number(openDeficiencies[0]?.count || 0),
      effectiveness: 95.2, 
      deficienciesBySeverity: deficiencySummary,
    });
  });

  // --- CSA & Testing Refactored (Basic) ---

  app.get('/api/csa', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(csaRecords).where(eq(csaRecords.organizationId, orgId));
    return ok(c, { items });
  });

  app.post('/api/csa', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const userId = c.get('userId');
    const body = await c.req.json<Partial<CSARecord>>();
    
    const id = crypto.randomUUID();
    const newCsa: any = {
      id,
      organizationId: orgId,
      controlId: body.controlId!,
      period: body.period || "2024-Q1",
      assessmentDate: new Date(),
      assessedBy: userId,
      result: body.result || "Effective",
      comments: body.comments,

      // New Regulatory Fields (SK-5/2024)
      transReference: body.transReference,
      attrA: body.attrA ?? false,
      attrB: body.attrB ?? false,
      attrC: body.attrC ?? false,
      attrD: body.attrD ?? false,

      // Forensic Metadata
      gpsVerified: body.gpsVerified ?? false,
      latitude: body.latitude,
      longitude: body.longitude,
      timestampVerified: body.timestampVerified ?? false,
      capturedAt: body.capturedAt ? new Date(body.capturedAt) : null,
      hash: body.hash,
      biometricVerified: body.biometricVerified ?? false,

      // ITAC Specific
      itacScenario: body.itacScenario,
      itacMethod: body.itacMethod,
      itacSampleInfo: body.itacSampleInfo,
      itacExpectedResult: body.itacExpectedResult,
      itacActualResult: body.itacActualResult,
    };

    await db.insert(csaRecords).values(newCsa);

    // Auto-Deficiency logic: If result is Ineffective, create a deficiency
    if (newCsa.result === 'Ineffective') {
        const deficiencyId = crypto.randomUUID();
        await db.insert(deficiencies).values({
            id: deficiencyId,
            organizationId: orgId,
            controlId: newCsa.controlId,
            description: `CSA result for ${newCsa.period} is Ineffective. Comments: ${newCsa.comments || 'No comments provided.'}`,
            severity: 'Control Deficiency',
            identifiedDate: new Date(),
            identifiedBy: userId,
            status: 'Open'
        });
    }

    return ok(c, newCsa);
  });

  app.get('/api/tests', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(testRecords).where(eq(testRecords.organizationId, orgId));
    return ok(c, { items });
  });

  // --- Legacy/Support Routes ---

  app.get('/api/changelogs', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const items = await db.select().from(auditLogs).where(and(eq(auditLogs.organizationId, orgId), eq(auditLogs.isRegulatory, true)));
    return ok(c, { items });
  });

  app.get('/api/socreports', async (c) => {
    // Mock for now as it's usually static/uploaded docs
    return ok(c, { items: [] });
  });

  app.get('/api/wbsreports', async (c) => {
    // Integration with WBS (Lampiran 1 Principle 14 & 15)
    return ok(c, { items: [] });
  });

  // --- DEV TOOLS (Purge) ---

  app.delete('/api/dev/purge-scoping', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    
    await db.delete(glRows).where(eq(glRows.organizationId, orgId));
    await db.delete(glSnapshots).where(eq(glSnapshots.organizationId, orgId));
    await db.delete(simulations).where(eq(simulations.organizationId, orgId));
    
    return ok(c, { success: true });
  });

  app.delete('/api/dev/purge-bpm', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    
    await db.delete(bpmDiagrams).where(eq(bpmDiagrams.organizationId, orgId));
    await db.delete(rcms).where(eq(rcms.organizationId, orgId));
    await db.delete(controls).where(eq(controls.organizationId, orgId));
    
    return ok(c, { success: true });
  });

  app.get('/api/bpm/usage-check/:id', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const id = c.req.param('id');
    const type = c.req.query('type') as 'Risk' | 'Control';

    // We need to scan all diagrams to see if any node contains this ID in its data.riskIds or data.controlIds
    const diagrams = await db.select().from(bpmDiagrams).where(eq(bpmDiagrams.organizationId, orgId));
    
    const usage: { diagramId: string, diagramName: string, nodeId: string, nodeLabel: string }[] = [];

    for (const diag of diagrams) {
      const nodes = (diag.nodes as any[]) || [];
      for (const node of nodes) {
        if (type === 'Risk') {
          if (node.data?.riskIds?.includes(id)) {
            usage.push({ diagramId: diag.id, diagramName: diag.name, nodeId: node.id, nodeLabel: node.data.label });
          }
        } else {
          if (node.data?.controlIds?.includes(id)) {
            usage.push({ diagramId: diag.id, diagramName: diag.name, nodeId: node.id, nodeLabel: node.data.label });
          }
        }
      }
    }

    return ok(c, { count: usage.length, usage });
  });

  app.get('/api/bpm-diagrams/by-control/:controlId', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const controlId = c.req.param('controlId');

    // 1. Find the risk(s) linked to this control
    const links = await db.select().from(rcmControls).where(and(
      eq(rcmControls.controlId, controlId),
      eq(rcmControls.organizationId, orgId)
    ));

    if (links.length === 0) return notFound(c, 'Control not linked to any risk');

    // 2. Find the diagram node(s) linked to those risk(s)
    const riskIds = links.map(l => l.rcmId);
    const nodeLinks = await db.select().from(bpmNodeRcms).where(and(
      sql`${bpmNodeRcms.rcmId} IN ${riskIds}`,
      eq(bpmNodeRcms.organizationId, orgId)
    ));

    if (nodeLinks.length === 0) return notFound(c, 'Risk not linked to any diagram node');

    // For now, return the first diagram found
    const firstLink = nodeLinks[0];
    const diag = await db.select().from(bpmDiagrams).where(and(
      eq(bpmDiagrams.id, firstLink.diagramId),
      eq(bpmDiagrams.organizationId, orgId)
    )).limit(1);

    if (diag.length === 0) return notFound(c, 'Diagram not found');

    return ok(c, {
      diagram: diag[0],
      nodeId: firstLink.nodeId
    });
  });

  app.get('/api/bpm-diagrams/by-gl/:noGL', async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const orgId = c.get('organizationId');
    const noGL = c.req.param('noGL');

    // 1. Find the BPM Process linked to this GL
    const processes = await db.select().from(bpmProcesses)
      .where(and(
        eq(bpmProcesses.organizationId, orgId),
        eq(bpmProcesses.noGL, noGL)
      )).limit(1);

    if (processes.length === 0) return notFound(c, 'No BPM process linked to this account');

    const process = processes[0];

    // 2. Find the diagram that matches this process name/subprocess
    const diagrams = await db.select().from(bpmDiagrams)
      .where(and(
        eq(bpmDiagrams.organizationId, orgId),
        eq(bpmDiagrams.subProcess, process.name)
      )).limit(1);

    if (diagrams.length === 0) {
        // Fallback: try matching by name
        const byName = await db.select().from(bpmDiagrams)
            .where(and(
                eq(bpmDiagrams.organizationId, orgId),
                eq(bpmDiagrams.name, process.name)
            )).limit(1);
        
        if (byName.length === 0) return notFound(c, 'Diagram not found for this process');
        return ok(c, byName[0]);
    }

    return ok(c, diagrams[0]);
  });

  // --- AI Chatbot Routes ---

  const rateLimitStore = new Map<string, { count: number; resetDate: number }>();

  app.post('/api/ai/chat', async (c) => {
    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      return bad(c, 'GEMINI_API_KEY not configured.');
    }

    let body: { message: string; conversationHistory?: Array<{ role: string; content: string }> };
    try {
      body = await c.req.json();
    } catch (e) {
      return bad(c, 'Invalid request body');
    }

    const { message, conversationHistory = [] } = body;

    const clientId = c.req.header('X-Forwarded-For') || c.req.header('CF-Connecting-IP') || 'unknown';
    const now = Date.now();
    const dayMs = 86400000;

    let rateLimitData = rateLimitStore.get(clientId);
    if (!rateLimitData || now > rateLimitData.resetDate) {
      rateLimitData = { count: 0, resetDate: now + dayMs };
      rateLimitStore.set(clientId, rateLimitData);
    }

    if (rateLimitData.count >= 100) {
      return bad(c, 'Rate limit exceeded.', 429);
    }

    rateLimitData.count++;

    const context = (body as any).context;
    const pageContext = context?.path ? `\nPengguna saat ini sedang melihat halaman: ${context.path}` : '';

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-lite",
        systemInstruction: `Anda adalah Asisten AI ICOFR yang membantu pengguna memahami regulasi Pengendalian Internal atas Pelaporan Keuangan (ICOFR) berdasarkan SK-5/DKU.MBU/11/2024.

Jawablah pertanyaan dengan akurat berdasarkan dokumen yang disediakan di bawah ini.
Sebutkan referensi BAB dan Pasal jika relevan.
${pageContext}

Jika pertanyaan tidak terkait ICOFR, jawab dengan sopan bahwa Anda hanya dapat membantu pertanyaan tentang ICOFR.

Bahasa: Bahasa Indonesia

--- DOKUMEN ICOFR ---
${ICOFR_KNOWLEDGE_BASE}
--- END DOKUMEN ---`
      });

      const recentHistory = conversationHistory.slice(-10);
      const chat = model.startChat({
        history: recentHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }))
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      const responseText = response.text();

      return ok(c, {
        response: responseText,
        sources: []
      });

    } catch (error: any) {
      return bad(c, `AI service error: ${error.message}`, 500);
    }
  });
}