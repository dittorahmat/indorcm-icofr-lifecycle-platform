import { Hono } from "hono";
import type { Env } from './core-utils';
import { ok, bad, notFound } from './core-utils';
import {
  UserEntity, ChatBoardEntity, RCMEntity, ControlEntity,
  DeficiencyEntity, ActionPlanEntity, CSAEntity, TestEntity,
  MaterialityEntity, ScopingEntity, ChangeLogEntity, SOCReportEntity,
  ApplicationEntity, RiskLibraryEntity, AggregateDeficiencyEntity, SettingsEntity
} from "./entities";
import type { Control, RCM, CSARecord, TestRecord, Deficiency, ActionPlan, UserRole, Materiality, Scoping, ChangeLog, SOCReport, Application, BUMNCluster, RiskLibrary, Settings, User } from "@shared/types";
import { z } from "zod";
import { parseCsv, unparseCsv } from './csv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ICOFR_KNOWLEDGE_BASE, METADATA } from './knowledge-base';

const createWithAudit = async <T extends { id: string }>(Entity: any, env: Env, data: T, userId: string) => {
  const auditableData = { ...data, auditTrail: [{ action: 'created', userId, timestamp: Date.now() }] };
  return await Entity.create(env, auditableData);
};

const patchWithAudit = async <T>(entity: any, patchData: Partial<T>, userId: string) => {
  await entity.mutate((s: any) => ({
    ...s,
    ...patchData,
    auditTrail: [...(s.auditTrail || []), { action: 'updated', userId, timestamp: Date.now() }],
  }));
};

/**
 * Simple Token Helper for Prototype
 * In a real app, use JWT with a secret.
 */
const signToken = (data: { userId: string, role: string }) => {
  const payload = JSON.stringify({ ...data, exp: Date.now() + 24 * 60 * 60 * 1000 });
  return btoa(payload);
};

const verifyToken = (token: string): { userId: string, role: UserRole } | null => {
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};

export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- Auth Middleware ---
  app.use('/api/*', async (c, next) => {
    // Seed data on first load
    await Promise.all([
      UserEntity.ensureSeed(c.env), ChatBoardEntity.ensureSeed(c.env),
      RCMEntity.ensureSeed(c.env), ControlEntity.ensureSeed(c.env),
      DeficiencyEntity.ensureSeed(c.env), ActionPlanEntity.ensureSeed(c.env),
      MaterialityEntity.ensureSeed(c.env), ScopingEntity.ensureSeed(c.env),
      ChangeLogEntity.ensureSeed(c.env), SOCReportEntity.ensureSeed(c.env),
      ApplicationEntity.ensureSeed(c.env), RiskLibraryEntity.ensureSeed(c.env),
      AggregateDeficiencyEntity.ensureSeed(c.env), SettingsEntity.ensureSeed(c.env),
      TestEntity.ensureSeed(c.env),
    ]);

    const authHeader = c.req.header('Authorization');
    
    // Legacy support for X-Mock-Role during transition, but prefer Bearer
    let role: UserRole = 'Line 1';
    let userId = 'u1';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      if (decoded) {
        role = decoded.role;
        userId = decoded.userId;
      }
    } else {
      // Fallback to header for dev/transition
      role = (c.req.header('X-Mock-Role') as UserRole) || 'Line 1';
      const users = (await UserEntity.list(c.env)).items;
      const user = users.find(u => u.role === role) || users[0];
      userId = user?.id || 'u1';
    }

    (c as any).set('userRole', role);
    (c as any).set('userId', userId);
    await next();
  });

  // --- Auth Routes ---
  app.post('/api/auth/login', async (c) => {
    const { role } = await c.req.json<{ role: UserRole }>();
    const users = (await UserEntity.list(c.env)).items;
    const user = users.find(u => u.role === role) || users[0];
    
    if (!user) return bad(c, 'User not found');
    
    const token = signToken({ userId: user.id, role: user.role || 'Line 1' });
    return ok(c, { token, user });
  });

  app.get('/api/auth/me', async (c) => {
    const userId = (c as any).get('userId');
    const user = new UserEntity(c.env, userId);
    if (!await user.exists()) return notFound(c, 'User not found');
    return ok(c, await user.getState());
  });

  // --- ICOFR Routes ---
  app.get('/api/rcm', async (c) => ok(c, await RCMEntity.list(c.env)));
  app.post('/api/rcm', async (c) => {
    if ((c as any).get('userRole') !== 'Line 2') return bad(c, 'Access Denied');
    const body = await c.req.json<Partial<RCM>>();
    const newRcm: RCM = { id: crypto.randomUUID(), process: "New Process", subProcess: "New Sub-Process", riskDescription: "New Risk", status: "Draft", controls: [], ...body };
    return ok(c, await createWithAudit(RCMEntity, c.env, newRcm, (c as any).get('userId')));
  });

  app.put('/api/rcm/:id', async (c) => {
    const role = (c as any).get('userRole');
    const id = c.req.param('id');
    const body = await c.req.json<Partial<RCM>>();
    const rcm = new RCMEntity(c.env, id);
    if (!await rcm.exists()) return notFound(c, 'RCM not found');

    if (role === 'Line 1') {
      // Line 1 can only request changes
      await patchWithAudit(rcm, { 
        status: 'Pending Change Approval',
        changeRequest: {
          requestedBy: (c as any).get('userId'),
          requestedAt: Date.now(),
          description: "Update requested by Process Owner",
          proposedData: body
        }
      }, (c as any).get('userId'));
      return ok(c, await rcm.getState());
    }

    if (role !== 'Line 2') return bad(c, 'Access Denied');
    await patchWithAudit(rcm, body, (c as any).get('userId'));
    return ok(c, await rcm.getState());
  });

  app.post('/api/rcm/:id/approve-change', async (c) => {
    if ((c as any).get('userRole') !== 'Line 2') return bad(c, 'Access Denied');
    const id = c.req.param('id');
    const rcm = new RCMEntity(c.env, id);
    if (!await rcm.exists()) return notFound(c, 'RCM not found');
    const state = await rcm.getState();
    if (state.status !== 'Pending Change Approval' || !state.changeRequest) return bad(c, 'No pending change request');

    const userId = (c as any).get('userId');
    const proposed = state.changeRequest.proposedData;
    
    // Generate a simple summary of changes
    const changes: string[] = [];
    if (proposed.riskDescription && proposed.riskDescription !== state.riskDescription) changes.push(`Risk: ${state.riskDescription} -> ${proposed.riskDescription}`);
    if (proposed.process && proposed.process !== state.process) changes.push(`Process: ${state.process} -> ${proposed.process}`);
    if (proposed.subProcess && proposed.subProcess !== state.subProcess) changes.push(`Sub-Process: ${state.subProcess} -> ${proposed.subProcess}`);
    if (proposed.bpmData) changes.push("BPM Diagram structure updated");

    const descriptionAfter = changes.join("; ") || "General RCM/BPM updates";

    // Create ChangeLog record
    const log: ChangeLog = {
      id: crypto.randomUUID(),
      entityId: id,
      entityType: "RCM",
      descriptionBefore: "Original Design / Previous State",
      descriptionAfter: descriptionAfter,
      userId: state.changeRequest.requestedBy,
      timestamp: Date.now(),
      effectiveDate: Date.now(),
      approvedBy: userId
    };
    await createWithAudit(ChangeLogEntity, c.env, log, userId);

    await patchWithAudit(rcm, { 
      ...proposed,
      status: 'Active',
      changeRequest: undefined 
    }, userId);
    
    return ok(c, await rcm.getState());
  });

  app.post('/api/rcm/:id/reject-change', async (c) => {
    if ((c as any).get('userRole') !== 'Line 2') return bad(c, 'Access Denied');
    const id = c.req.param('id');
    const { reason } = await c.req.json<{ reason: string }>();
    const rcm = new RCMEntity(c.env, id);
    if (!await rcm.exists()) return notFound(c, 'RCM not found');
    
    await rcm.mutate((s: any) => ({
      ...s,
      status: 'Active',
      changeRequest: undefined,
      auditTrail: [...(s.auditTrail || []), { 
        action: 'rejected', 
        userId: (c as any).get('userId'), 
        timestamp: Date.now(),
        comment: reason
      }],
    }));
    
    return ok(c, await rcm.getState());
  });

  app.post('/api/rcm/:id/validate', async (c) => {
    if ((c as any).get('userRole') !== 'Line 2') return bad(c, 'Access Denied');
    const id = c.req.param('id');
    const rcm = new RCMEntity(c.env, id);
    if (!await rcm.exists()) return notFound(c, 'RCM not found');
    await patchWithAudit(rcm, { status: 'Active' }, (c as any).get('userId'));
    return ok(c, await rcm.getState());
  });

  app.get('/api/controls', async (c) => ok(c, await ControlEntity.list(c.env)));
  app.post('/api/controls', async (c) => {
    if ((c as any).get('userRole') !== 'Line 2') return bad(c, 'Access Denied');
    const body = await c.req.json<Partial<Control>>();
    if (!body.rcmId) return bad(c, 'rcmId is required');
    const newControl: Control = { 
      id: crypto.randomUUID(), code: "", name: "New Control", description: "", ownerId: "u1", 
      type: "Preventive", nature: "Manual", frequency: "Monthly", assertions: [], ipos: [], 
      cosoPrinciples: [], riskRating: "Low", isKeyControl: false, isFraudRisk: false, effectiveDate: Date.now(), 
      fsliCodes: [], ...body, rcmId: body.rcmId 
    };
    return ok(c, await createWithAudit(ControlEntity, c.env, newControl, (c as any).get('userId')));
  });

  app.get('/api/materiality', async (c) => ok(c, await MaterialityEntity.list(c.env)));
  app.post('/api/materiality', async (c) => {
    if ((c as any).get('userRole') !== 'Line 2') return bad(c, 'Access Denied');
    const body = await c.req.json<Partial<Materiality>>();
    const newMat: Materiality = { id: crypto.randomUUID(), year: new Date().getFullYear(), overallMateriality: 0, performanceMateriality: 0, benchmark: "Pre-Tax Income", percentage: 5, haircut: 25, isGroupConsolidation: false, ...body };
    return ok(c, await createWithAudit(MaterialityEntity, c.env, newMat, (c as any).get('userId')));
  });

  app.get('/api/scoping', async (c) => ok(c, await ScopingEntity.list(c.env)));
  app.post('/api/scoping', async (c) => {
    if ((c as any).get('userRole') !== 'Line 2') return bad(c, 'Access Denied');
    const body = await c.req.json<Partial<Scoping>>();
    const newScope: Scoping = { id: crypto.randomUUID(), year: new Date().getFullYear(), significantAccounts: [], significantLocations: [], significantProcesses: [], ...body };
    return ok(c, await createWithAudit(ScopingEntity, c.env, newScope, (c as any).get('userId')));
  });

  app.get('/api/changelogs', async (c) => ok(c, await ChangeLogEntity.list(c.env)));
  app.put('/api/controls/:id', async (c) => {
    if ((c as any).get('userRole') !== 'Line 2') return bad(c, 'Access Denied');
    const id = c.req.param('id');
    const body = await c.req.json<Partial<Control>>();
    const control = new ControlEntity(c.env, id);
    if (!await control.exists()) return notFound(c, 'Control not found');
    await patchWithAudit(control, body, (c as any).get('userId'));
    return ok(c, await control.getState());
  });
  app.get('/api/deficiencies', async (c) => ok(c, await DeficiencyEntity.list(c.env)));
  app.get('/api/aggregatedeficiencies', async (c) => ok(c, await AggregateDeficiencyEntity.list(c.env)));
  app.post('/api/aggregatedeficiencies', async (c) => {
    if (!['Line 2', 'Line 3', 'Admin'].includes((c as any).get('userRole'))) return bad(c, 'Access Denied');
    const body = await c.req.json<Partial<AggregateDeficiency>>();
    const newAggr: AggregateDeficiency = { 
      id: crypto.randomUUID(), name: "Aggregate Analysis", year: new Date().getFullYear(), 
      deficiencyIds: [], affectedAccounts: [], affectedAssertions: [], 
      combinedMagnitude: 0, aggregateLikelihood: "Low", finalSeverity: "Control Deficiency", 
      conclusionRationale: "", identifiedBy: (c as any).get('userId'), 
      identifiedDate: Date.now(), ...body 
    };
    return ok(c, await createWithAudit(AggregateDeficiencyEntity, c.env, newAggr, (c as any).get('userId')));
  });

  app.get('/api/settings', async (c) => {
    const settings = new SettingsEntity(c.env, 'global');
    return ok(c, await settings.getState());
  });
  app.put('/api/settings', async (c) => {
    if ((c as any).get('userRole') !== 'Line 2' && (c as any).get('userRole') !== 'Admin') return bad(c, 'Access Denied');
    const body = await c.req.json<Partial<Settings>>();
    const settings = new SettingsEntity(c.env, 'global');
    await settings.mutate(s => ({ ...s, ...body }));
    return ok(c, await settings.getState());
  });

  app.put('/api/deficiencies/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json<Partial<Deficiency>>();
    const def = new DeficiencyEntity(c.env, id);
    if (!await def.exists()) return notFound(c, 'Deficiency not found');
    await patchWithAudit(def, body, (c as any).get('userId'));
    return ok(c, await def.getState());
  });
  app.get('/api/actionplans', async (c) => ok(c, await ActionPlanEntity.list(c.env)));
  app.get('/api/csa', async (c) => ok(c, await CSAEntity.list(c.env)));
  app.put('/api/actionplans/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json<Partial<ActionPlan>>();
    const ap = new ActionPlanEntity(c.env, id);
    if (!await ap.exists()) return notFound(c, 'Action Plan not found');
    await patchWithAudit(ap, body, (c as any).get('userId'));
    return ok(c, await ap.getState());
  });
  app.post('/api/csa', async (c) => {
    if ((c as any).get('userRole') !== 'Line 1') return bad(c, 'Access Denied: Only Line 1 can submit CSAs.');
    const body = await c.req.json<Partial<CSARecord>>();
    if (!body.controlId || !body.result) return bad(c, 'controlId and result are required');
    const newCSA: CSARecord = { id: crypto.randomUUID(), assessmentDate: Date.now(), assessedBy: (c as any).get('userId'), comments: "", ...body, controlId: body.controlId, result: body.result, period: body.period || "2024-Q1" };
    const created = await createWithAudit(CSAEntity, c.env, newCSA, (c as any).get('userId'));
    if (created.result === 'High' || created.result === 'Medium') {
      const newDef: Deficiency = {
        id: crypto.randomUUID(), controlId: created.controlId,
        description: `CSA Issue (${created.result}): ${created.comments || 'No comment provided.'}`,
        severity: 'Control Deficiency', identifiedDate: Date.now(),
        identifiedBy: created.assessedBy, status: 'Open', relatedAssertions: []
      };
      await createWithAudit(DeficiencyEntity, c.env, newDef, (c as any).get('userId'));
    }
    return ok(c, created);
  });

  app.post('/api/csa/:id/validate', async (c) => {
    if ((c as any).get('userRole') !== 'Line 2') return bad(c, 'Access Denied: Only Line 2 can validate CSAs.');
    const id = c.req.param('id');
    const { status, comments } = await c.req.json<{ status: "Validated" | "Rejected", comments: string }>();
    const csa = new CSAEntity(c.env, id);
    if (!await csa.exists()) return notFound(c, 'CSA record not found');

    const userId = (c as any).get('userId');
    const csaState = await csa.getState();
    
    await csa.mutate((s: any) => ({
      ...s,
      line2Status: status,
      line2Comments: comments,
      line2ValidatedBy: userId,
      line2ValidatedDate: Date.now(),
      auditTrail: [...(s.auditTrail || []), { 
        action: status === 'Validated' ? 'validated' : 'rejected_by_l2', 
        userId, 
        timestamp: Date.now(),
        comment: comments
      }],
    }));

    // Sync status to the Control Entity for handover visibility
    const control = new ControlEntity(c.env, csaState.controlId);
    if (await control.exists()) {
      await control.mutate((s: any) => ({
        ...s,
        line2Validation: {
          status,
          validatedBy: userId,
          validatedDate: Date.now(),
          comments
        }
      }));
    }

    return ok(c, await csa.getState());
  });

  app.post('/api/tests', async (c) => {
    if ((c as any).get('userRole') !== 'Line 3') return bad(c, 'Access Denied: Only Line 3 can submit tests.');
    const body = await c.req.json<Partial<TestRecord>>();
    if (!body.controlId || !body.result || !body.testType) return bad(c, 'controlId, result, and testType are required');
    const newTest: TestRecord = { id: crypto.randomUUID(), testDate: Date.now(), testedBy: (c as any).get('userId'), comments: "", ...body, controlId: body.controlId, result: body.result, testType: body.testType, period: body.period || "2024-Q1", method: body.method || "Inspection" };
    const created = await createWithAudit(TestEntity, c.env, newTest, (c as any).get('userId'));
    if (created.result === 'Fail') {
      const newDef: Deficiency = {
        id: crypto.randomUUID(), controlId: created.controlId,
        description: `${created.testType} Failed: ${created.comments || 'No comment provided.'}`,
        severity: 'Significant Deficiency', identifiedDate: Date.now(),
        identifiedBy: created.testedBy, status: 'Open', relatedAssertions: []
      };
      await createWithAudit(DeficiencyEntity, c.env, newDef, (c as any).get('userId'));
    }
    return ok(c, created);
  });
  app.get('/api/tests', async (c) => ok(c, await TestEntity.list(c.env)));

  app.post('/api/reports/sign-off', async (c) => {
    if (!['Line 2', 'Admin'].includes((c as any).get('userRole'))) return bad(c, 'Access Denied');
    const settings = new SettingsEntity(c.env, 'global');
    const state = await settings.getState();
    if (state.isPeriodLocked) return bad(c, 'Period already locked');

    const userId = (c as any).get('userId');
    const hash = crypto.randomUUID().split('-')[0].toUpperCase(); 
    
    await settings.mutate(s => ({
      ...s,
      isPeriodLocked: true,
      signedOffDate: Date.now(),
      signedOffBy: userId,
      verificationHash: hash
    }));

    return ok(c, await settings.getState());
  });

  app.get('/api/reports/verify/:hash', async (c) => {
    const hash = c.req.param('hash');
    const settings = new SettingsEntity(c.env, 'global');
    const state = await settings.getState();
    if (state.verificationHash === hash) {
      return ok(c, { verified: true, company: state.companyName, date: state.signedOffDate });
    }
    return bad(c, 'Invalid verification hash');
  });

  app.get('/api/reports/summary', async (c) => {
    const [controls, deficiencies, rcms] = await Promise.all([
      ControlEntity.list(c.env), DeficiencyEntity.list(c.env), RCMEntity.list(c.env)
    ]);
    const totalAudits = rcms.items.reduce((sum, i) => sum + (i.auditTrail?.length || 0), 0);
    const summary = {
      effectiveness: 95.2, totalControls: controls.items.length,
      openDeficiencies: deficiencies.items.filter(d => d.status === 'Open').length,
      deficienciesBySeverity: Object.entries(deficiencies.items.reduce((acc, d) => ({ ...acc, [d.severity]: (acc[d.severity] || 0) + 1 }), {} as Record<string, number>)).map(([name, count]) => ({ name, count })),
      deficienciesByStatus: Object.entries(deficiencies.items.reduce((acc, d) => ({ ...acc, [d.status]: (acc[d.status] || 0) + 1 }), {} as Record<string, number>)).map(([name, count]) => ({ name, count })),
      allDeficiencies: deficiencies.items,
      audits: { total: totalAudits, recent: [] }
    };
    return ok(c, summary);
  });

  app.post('/api/reports/export', async (c) => {
    if ((c as any).get('userRole') !== 'Line 2') return bad(c, 'Access Denied');
    const format = c.req.query('format');
    const [rcms, controls, deficiencies] = await Promise.all([
      RCMEntity.list(c.env), ControlEntity.list(c.env), DeficiencyEntity.list(c.env)
    ]);
    const dataToExport = { RCMs: rcms.items, Controls: controls.items, Deficiencies: deficiencies.items };
    
    if (format === 'csv') {
      let csvContent = '';
      csvContent += '--- RCMs ---\n';
      csvContent += unparseCsv(dataToExport.RCMs as any[]);
      csvContent += '\n\n--- Controls ---\n';
      csvContent += unparseCsv(dataToExport.Controls as any[]);
      csvContent += '\n\n--- Deficiencies ---\n';
      csvContent += unparseCsv(dataToExport.Deficiencies as any[]);

      return new Response(csvContent, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="report.csv"' } });
    }
    return ok(c, dataToExport);
  });

  app.post('/api/import/rcm', async (c) => {
    if ((c as any).get('userRole') !== 'Line 2') return bad(c, 'Access Denied');
    const { fileContent } = await c.req.json<{ fileContent: string }>();
    const parsed = parseCsv<any>(fileContent, { header: true, skipEmptyLines: true });
    let imported = 0;
    const errors: string[] = [];
    const rcmMap = new Map<string, RCM>();
    for (const [index, row] of parsed.data.entries()) {
      const { process, subProcess, riskDescription, controlName, controlDescription } = row;
      const rcmKey = `${process}-${subProcess}`;
      let rcm = rcmMap.get(rcmKey);
      if (!rcm) {
        rcm = { id: crypto.randomUUID(), process, subProcess, riskDescription, controls: [], status: 'Draft' };
        rcmMap.set(rcmKey, rcm);
      }
      const control: Control = {
        id: crypto.randomUUID(), rcmId: rcm.id, name: controlName, description: controlDescription,
        ownerId: 'u1', type: 'Preventive', nature: 'Manual', assertions: [], frequency: 'Monthly', ipos: [], cosoPrinciples: [], riskRating: 'Low', isKeyControl: false, isFraudRisk: false, effectiveDate: Date.now()
      };
      rcm.controls.push(control.id);
      await createWithAudit(ControlEntity, c.env, control, (c as any).get('userId'));
      imported++;
    }
    await Promise.all(Array.from(rcmMap.values()).map(rcm => createWithAudit(RCMEntity, c.env, rcm, (c as any).get('userId'))));
    return ok(c, { imported, errors });
  });

  app.get('/api/audits/:entityType/:id', async (c) => {
    const entityType = c.req.param('entityType');
    const id = c.req.param('id');
    let entity: any;
    if (entityType === 'rcm') entity = new RCMEntity(c.env, id);
    else if (entityType === 'control') entity = new ControlEntity(c.env, id);
    else return bad(c, 'Invalid entity type');
    if (!await entity.exists()) return notFound(c);
    return ok(c, await entity.getAuditTrail());
  });

  app.get('/api/socreports', async (c) => ok(c, await SOCReportEntity.list(c.env)));
  app.post('/api/socreports', async (c) => {
    if ((c as any).get('userRole') !== 'Line 2') return bad(c, 'Access Denied');
    const body = await c.req.json<Partial<SOCReport>>();
    const newSoc: SOCReport = { id: crypto.randomUUID(), vendorName: "New Vendor", reportType: "SOC 1 Type 2", periodStart: Date.now(), periodEnd: Date.now(), issuer: "", status: "Pending Review", lastValidatedDate: Date.now(), ...body };
    return ok(c, await createWithAudit(SOCReportEntity, c.env, newSoc, (c as any).get('userId')));
  });

  app.get('/api/applications', async (c) => ok(c, await ApplicationEntity.list(c.env)));
  app.post('/api/applications', async (c) => {
    if ((c as any).get('userRole') !== 'Line 2') return bad(c, 'Access Denied');
    const body = await c.req.json<Partial<Application>>();
    const newApp: Application = { id: crypto.randomUUID(), name: "New Application", description: "", statusITGC: "Not Tested", criticality: "Medium", ...body };
    return ok(c, await createWithAudit(ApplicationEntity, c.env, newApp, (c as any).get('userId')));
  });

  app.get('/api/wbsreports', async (c) => {
    // For now, return static mock data since Entity isn't implemented yet
    const mockWBS = [
      {
        id: "wbs-1",
        reportDate: Date.now() - 5 * 86400000,
        category: "Fraudulent Financial Reporting",
        description: "Potential override of controls in revenue recognition for Coal Export division.",
        impactMagnitude: 1500000000,
        status: "Confirmed",
        relatedControlIds: ["c1", "c2"]
      },
      {
        id: "wbs-2",
        reportDate: Date.now() - 12 * 86400000,
        category: "Asset Misappropriation",
        description: "Unauthorized fuel disposal detected in East Mining site.",
        impactMagnitude: 250000000,
        status: "Investigating",
        relatedControlIds: ["c5"]
      }
    ];
    return ok(c, { items: mockWBS });
  });

  app.get('/api/risklibrary', async (c) => ok(c, await RiskLibraryEntity.list(c.env)));
  app.get('/api/users', async (c) => ok(c, await UserEntity.list(c.env)));
  app.get('/api/auth/users', async (c) => ok(c, await UserEntity.list(c.env))); // Alias for auth context
  
  app.get('/api/chats', async (c) => ok(c, await ChatBoardEntity.list(c.env)));
  app.get('/api/chats/:chatId/messages', async (c) => {
    const chat = new ChatBoardEntity(c.env, c.req.param('chatId'));
    if (!await chat.exists()) return notFound(c, 'chat find failed');
    return ok(c, await chat.listMessages());
  });

  // === AI Chatbot Endpoint ===
  // Simple in-memory rate limiting for development
  const rateLimitStore = new Map<string, { count: number; resetDate: number }>();
  
  app.post('/api/ai/chat', async (c) => {
    // Validate API key
    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      console.error('[AI CHAT] GEMINI_API_KEY not configured');
      return bad(c, 'GEMINI_API_KEY not configured. Please set your API key in wrangler.jsonc or .dev.vars');
    }

    // Parse request body
    let body: { message: string; conversationHistory?: Array<{ role: string; content: string }> };
    try {
      body = await c.req.json();
    } catch (e) {
      return bad(c, 'Invalid request body');
    }

    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return bad(c, 'Message is required and must be a string');
    }

    // Simple in-memory rate limiting
    const clientId = c.req.header('X-Forwarded-For') || c.req.header('CF-Connecting-IP') || 'unknown';
    const now = Date.now();
    const dayMs = 86400000; // 24 hours in ms
    
    let rateLimitData = rateLimitStore.get(clientId);
    
    // Reset if expired or initialize
    if (!rateLimitData || now > rateLimitData.resetDate) {
      rateLimitData = { count: 0, resetDate: now + dayMs };
      rateLimitStore.set(clientId, rateLimitData);
    }

    if (rateLimitData.count >= 100) {
      return bad(c, 'Rate limit exceeded (100 requests/day). Please try again tomorrow.', 429);
    }

    // Increment counter
    rateLimitData.count++;

    try {
      // Initialize Gemini
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        systemInstruction: `Anda adalah Asisten AI ICOFR yang membantu pengguna memahami regulasi Pengendalian Internal atas Pelaporan Keuangan (ICOFR) berdasarkan SK-5/DKU.MBU/11/2024.

Jawablah pertanyaan dengan akurat berdasarkan dokumen yang disediakan di bawah ini.
Sebutkan referensi BAB dan Pasal jika relevan.

Jika pertanyaan tidak terkait ICOFR, jawab dengan sopan bahwa Anda hanya dapat membantu pertanyaan tentang ICOFR.

Bahasa: Bahasa Indonesia

--- DOKUMEN ICOFR ---
${ICOFR_KNOWLEDGE_BASE}
--- END DOKUMEN ---`
      });

      // Build conversation history (last 10 messages)
      const recentHistory = conversationHistory.slice(-10);
      const chat = model.startChat({
        history: recentHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }))
      });

      // Send message and get response
      const result = await chat.sendMessage(message);
      const response = await result.response;
      const responseText = response.text();

      // Log for monitoring
      console.log('[AI CHAT] Success:', {
        clientId,
        messageLength: message.length,
        responseLength: responseText.length,
        requestCount: rateLimitData.count
      });

      return ok(c, {
        response: responseText,
        sources: [] // Can be enhanced to extract specific references
      });

    } catch (error: any) {
      console.error('[AI CHAT] Error:', {
        message: error.message,
        stack: error.stack,
        clientId
      });

      // Handle specific errors
      if (error.message?.includes('API key')) {
        return bad(c, 'Invalid GEMINI_API_KEY');
      }

      if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
        return bad(c, 'Gemini API quota exceeded. Please try again later.', 429);
      }

      if (error.message?.includes('timeout')) {
        return bad(c, 'Request timeout. Please try again.', 504);
      }

      return bad(c, `AI service error: ${error.message}`, 500);
    }
  });
}