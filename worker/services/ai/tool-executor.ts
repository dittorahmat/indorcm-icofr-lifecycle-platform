import { eq, and, sql, gte, lte, or } from "drizzle-orm";
import { DrizzleDb } from "../../db";
import { 
  rcms, 
  controls, 
  rcmControls, 
  bpmDiagrams, 
  csaSchedules, 
  testRecords, 
  actionPlans,
  bpmProcesses
} from "../../db/schema";

export interface ToolContext {
  db: DrizzleDb;
  orgId: string;
  userId: string;
  role: string;
  departmentId: string;
}

export const AIToolExecutor = {
  async get_rcm_mapping(ctx: ToolContext, args: any) {
    const { subProcess, riskRating, isFraudRelated } = args;
    
    let query = ctx.db.select({
      risk: rcms.riskDescription,
      riskRating: rcms.riskRating,
      isFraud: rcms.isFraudRelated,
      process: rcms.process,
      subProcess: rcms.subProcess,
      controlCode: controls.code,
      controlName: controls.name,
    })
    .from(rcms)
    .leftJoin(rcmControls, eq(rcms.id, rcmControls.rcmId))
    .leftJoin(controls, eq(rcmControls.controlId, controls.id))
    .where(eq(rcms.organizationId, ctx.orgId))
    .$dynamic();

    if (subProcess) {
      query = query.where(sql`LOWER(${rcms.subProcess}) LIKE LOWER(${`%${subProcess}%`})`);
    }
    if (riskRating) {
      query = query.where(eq(rcms.riskRating, riskRating));
    }
    if (isFraudRelated !== undefined) {
      query = query.where(eq(rcms.isFraudRelated, isFraudRelated));
    }

    const results = await query.limit(20);
    return results;
  },

  async analyze_bpm_flow(ctx: ToolContext, args: any) {
    const { processId } = args;
    
    const diagram = await ctx.db.select()
      .from(bpmDiagrams)
      .where(and(eq(bpmDiagrams.id, processId), eq(bpmDiagrams.organizationId, ctx.orgId)))
      .limit(1);

    if (diagram.length === 0) return { error: "BPM Diagram not found." };

    const { nodes, edges, name } = diagram[0];
    
    // Simplify diagram for LLM
    const nodeMap = new Map((nodes as any[]).map(n => [n.id, n.data?.label || n.type]));
    const flowDescription = (edges as any[]).map(e => {
      const source = nodeMap.get(e.source);
      const target = nodeMap.get(e.target);
      return `${source} -> ${target}`;
    }).join(", ");

    return {
      processName: name,
      nodes: (nodes as any[]).map(n => ({ id: n.id, type: n.type, label: n.data?.label })),
      flow: flowDescription
    };
  },

  async get_csa_tasks(ctx: ToolContext, args: any) {
    const { status, timeframe } = args;
    
    let query = ctx.db.select({
      id: csaSchedules.id,
      type: csaSchedules.type,
      plannedDate: csaSchedules.plannedDate,
      status: csaSchedules.status,
      processName: bpmProcesses.name,
    })
    .from(csaSchedules)
    .leftJoin(bpmProcesses, eq(csaSchedules.bpmProcessId, bpmProcesses.id))
    .where(and(
      eq(csaSchedules.organizationId, ctx.orgId),
      or(eq(csaSchedules.assignedTo, ctx.userId), sql`${ctx.role} = 'Admin'`)
    ))
    .$dynamic();

    if (status) {
      query = query.where(eq(csaSchedules.status, status));
    }

    // Simplified timeframe logic for MVP
    if (timeframe?.includes("next month")) {
      const start = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + 1);
      query = query.where(and(gte(csaSchedules.plannedDate, start), lte(csaSchedules.plannedDate, end)));
    }

    const results = await query.limit(20);
    return results;
  },

  async get_test_history(ctx: ToolContext, args: any) {
    const { controlId, testType } = args;
    
    const results = await ctx.db.select({
      id: testRecords.id,
      testType: testRecords.testType,
      period: testRecords.period,
      result: testRecords.result,
      testDate: testRecords.testDate,
      comments: testRecords.comments,
    })
    .from(testRecords)
    .innerJoin(controls, eq(testRecords.controlId, controls.id))
    .where(and(
      eq(testRecords.organizationId, ctx.orgId),
      or(eq(controls.id, controlId), eq(controls.code, controlId))
    ))
    .limit(10);

    if (testType) {
      return results.filter(r => r.testType === testType);
    }

    return results;
  },

  async get_remediation_deadlines(ctx: ToolContext, args: any) {
    const { timeframe } = args;
    
    let query = ctx.db.select()
      .from(actionPlans)
      .where(and(
        eq(actionPlans.organizationId, ctx.orgId),
        or(eq(actionPlans.ownerId, ctx.userId), sql`${ctx.role} IN ('Admin', 'Line 2')`)
      ))
      .$dynamic();

    if (timeframe?.includes("next month")) {
      const start = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + 1);
      query = query.where(and(gte(actionPlans.dueDate, start), lte(actionPlans.dueDate, end)));
    }

    const results = await query.limit(20);
    return results;
  },

  async get_bpm_node_details(ctx: ToolContext, args: any) {
    const { nodeId, processId } = args;
    
    const diagram = await ctx.db.select()
      .from(bpmDiagrams)
      .where(and(eq(bpmDiagrams.id, processId), eq(bpmDiagrams.organizationId, ctx.orgId)))
      .limit(1);

    if (diagram.length === 0) return { error: "BPM Diagram not found." };

    const node = (diagram[0].nodes as any[]).find(n => n.id === nodeId);
    if (!node) return { error: "Node not found in diagram." };

    return {
      nodeId: node.id,
      type: node.type,
      label: node.data?.label,
      metadata: node.data?.metadata || {},
    };
  },

  async get_csa_missing_evidence(ctx: ToolContext, args: any) {
    const { csaRecordId } = args;
    
    // Using csa_samples to check for null evidence in controlResults JSON
    const results = await ctx.db.execute(sql`
      SELECT id, sample_ref, control_results
      FROM csa_samples
      WHERE csa_record_id = ${csaRecordId}
      AND organization_id = ${ctx.orgId}
    `);

    const samples = results.rows as any[];
    const missing = samples.filter(s => {
      const results = s.control_results || {};
      return Object.values(results).some((r: any) => !r.evidenceUrl);
    });

    return {
      totalSamples: samples.length,
      missingEvidenceCount: missing.length,
      missingSamples: missing.map(m => ({ id: m.id, ref: m.sample_ref }))
    };
  },

  async get_action_plan_details(ctx: ToolContext, args: any) {
    const { planId } = args;
    
    const plan = await ctx.db.select()
      .from(actionPlans)
      .where(and(eq(actionPlans.id, planId), eq(actionPlans.organizationId, ctx.orgId)))
      .limit(1);

    if (plan.length === 0) return { error: "Action plan not found." };

    return plan[0];
  }
};
