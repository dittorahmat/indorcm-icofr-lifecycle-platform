import { Hono } from "hono";
import type { Env } from './core-utils';
import { ok, bad, notFound } from './core-utils';
import {
  UserEntity, ChatBoardEntity, RCMEntity, ControlEntity,
  DeficiencyEntity, ActionPlanEntity, CSAEntity, TestEntity,
  MaterialityEntity, ScopingEntity, ChangeLogEntity, SOCReportEntity,
  ApplicationEntity, RiskLibraryEntity
} from "./entities";
import type { Control, RCM, CSARecord, TestRecord, Deficiency, ActionPlan, UserRole, Materiality, Scoping, ChangeLog, SOCReport, Application, BUMNCluster, RiskLibrary } from "@shared/types";
import { z } from "zod";
import { parseCsv, unparseCsv } from './csv';

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

export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- Middleware for Auth and Seeding ---
  app.use('/api/*', async (c, next) => {
    // Seed data on first load
    await Promise.all([
      UserEntity.ensureSeed(c.env), ChatBoardEntity.ensureSeed(c.env),
      RCMEntity.ensureSeed(c.env), ControlEntity.ensureSeed(c.env),
      DeficiencyEntity.ensureSeed(c.env), ActionPlanEntity.ensureSeed(c.env),
      MaterialityEntity.ensureSeed(c.env), ScopingEntity.ensureSeed(c.env),
      ChangeLogEntity.ensureSeed(c.env), SOCReportEntity.ensureSeed(c.env),
      ApplicationEntity.ensureSeed(c.env), RiskLibraryEntity.ensureSeed(c.env),
      AggregateDeficiencyEntity.ensureSeed(c.env),
    ]);
    // Mock Auth
    const role = (c.req.header('X-Mock-Role') as UserRole) || 'Line 1';
    const user = (await UserEntity.list(c.env)).items.find(u => u.role === role);
    (c as any).set('userRole', role);
    (c as any).set('userId', user?.id || 'u1');
    await next();
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

    await patchWithAudit(rcm, { 
      ...state.changeRequest.proposedData,
      status: 'Active',
      changeRequest: undefined 
    }, (c as any).get('userId'));
    
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
      cosoPrinciples: [], riskRating: "Low", isKeyControl: false, ...body, rcmId: body.rcmId 
    };
    return ok(c, await createWithAudit(ControlEntity, c.env, newControl, (c as any).get('userId')));
  });

  app.get('/api/materiality', async (c) => ok(c, await MaterialityEntity.list(c.env)));
  app.post('/api/materiality', async (c) => {
    if ((c as any).get('userRole') !== 'Line 2') return bad(c, 'Access Denied');
    const body = await c.req.json<Partial<Materiality>>();
    const newMat: Materiality = { id: crypto.randomUUID(), year: new Date().getFullYear(), overallMateriality: 0, performanceMateriality: 0, benchmark: "Pre-Tax Income", percentage: 5, haircut: 25, ...body };
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
  app.put('/api/deficiencies/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json<Partial<Deficiency>>();
    const def = new DeficiencyEntity(c.env, id);
    if (!await def.exists()) return notFound(c, 'Deficiency not found');
    await patchWithAudit(def, body, (c as any).get('userId'));
    return ok(c, await def.getState());
  });
  app.get('/api/actionplans', async (c) => ok(c, await ActionPlanEntity.list(c.env)));
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
    const newCSA: CSARecord = { id: crypto.randomUUID(), assessmentDate: Date.now(), assessedBy: (c as any).get('userId'), comments: "", ...body, controlId: body.controlId, result: body.result };
    const created = await createWithAudit(CSAEntity, c.env, newCSA, (c as any).get('userId'));
    if (created.result === 'Fail') {
      const newDef: Deficiency = {
        id: crypto.randomUUID(), controlId: created.controlId,
        description: `CSA Failed: ${created.comments || 'No comment provided.'}`,
        severity: 'Control Deficiency', identifiedDate: Date.now(),
        identifiedBy: created.assessedBy, status: 'Open',
      };
      await createWithAudit(DeficiencyEntity, c.env, newDef, (c as any).get('userId'));
    }
    return ok(c, created);
  });
  app.post('/api/tests', async (c) => {
    if ((c as any).get('userRole') !== 'Line 3') return bad(c, 'Access Denied: Only Line 3 can submit tests.');
    const body = await c.req.json<Partial<TestRecord>>();
    if (!body.controlId || !body.result || !body.testType) return bad(c, 'controlId, result, and testType are required');
    const newTest: TestRecord = { id: crypto.randomUUID(), testDate: Date.now(), testedBy: (c as any).get('userId'), comments: "", ...body, controlId: body.controlId, result: body.result, testType: body.testType };
    const created = await createWithAudit(TestEntity, c.env, newTest, (c as any).get('userId'));
    if (created.result === 'Fail') {
      const newDef: Deficiency = {
        id: crypto.randomUUID(), controlId: created.controlId,
        description: `${created.testType} Failed: ${created.comments || 'No comment provided.'}`,
        severity: 'Significant Deficiency', identifiedDate: Date.now(),
        identifiedBy: created.testedBy, status: 'Open',
      };
      await createWithAudit(DeficiencyEntity, c.env, newDef, (c as any).get('userId'));
    }
    return ok(c, created);
  });
  // --- Reporting & Import/Export ---
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
    
    // Return JSON payload if no recognized format is provided
    return ok(c, dataToExport);
  });
  const rcmRowSchema = z.object({
    process: z.string().min(1), subProcess: z.string().min(1),
    riskDescription: z.string().min(1), controlName: z.string().min(1),
    controlDescription: z.string().min(1),
  });
  type RcmRow = z.infer<typeof rcmRowSchema>;
  app.post('/api/import/rcm', async (c) => {
    if ((c as any).get('userRole') !== 'Line 2') return bad(c, 'Access Denied');
    const { fileContent } = await c.req.json<{ fileContent: string }>();
    const parsed = parseCsv<RcmRow>(fileContent, { header: true, skipEmptyLines: true });
    let imported = 0;
    const errors: string[] = [];
    const rcmMap = new Map<string, RCM>();
    for (const [index, row] of parsed.data.entries()) {
      const result = rcmRowSchema.safeParse(row);
      if (!result.success) {
        errors.push(`Row ${index + 2}: ${Object.values(result.error.flatten().fieldErrors).flat().join(', ')}`);
        continue;
      }
      const { process, subProcess, riskDescription, controlName, controlDescription } = result.data;
      const rcmKey = `${process}-${subProcess}`;
      let rcm = rcmMap.get(rcmKey);
      if (!rcm) {
        rcm = { id: crypto.randomUUID(), process, subProcess, riskDescription, controls: [] };
        rcmMap.set(rcmKey, rcm);
      }
      const control: Control = {
        id: crypto.randomUUID(), rcmId: rcm.id, name: controlName, description: controlDescription,
        ownerId: 'u1', type: 'Preventive', nature: 'Manual', assertions: [], materiality: 'Low'
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
  // --- Original Demo Routes ---
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

  app.get('/api/risklibrary', async (c) => ok(c, await RiskLibraryEntity.list(c.env)));

  app.get('/api/users', async (c) => ok(c, await UserEntity.list(c.env)));
  app.get('/api/chats', async (c) => ok(c, await ChatBoardEntity.list(c.env)));
  app.get('/api/chats/:chatId/messages', async (c) => {
    const chat = new ChatBoardEntity(c.env, c.req.param('chatId'));
    if (!await chat.exists()) return notFound(c, 'chat find failed');
    return ok(c, await chat.listMessages());
  });
}
