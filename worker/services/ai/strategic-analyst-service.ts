import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { DrizzleDb } from "../../db";
import { 
  simulations, 
  glRows, 
  testRecords, 
  deficiencies,
  controls,
  bpmProcesses
} from "../../db/schema";
import { ToolContext } from "./tool-executor";

export class StrategicAnalystService {
  /**
   * Aggregates materiality and deficiency data for an executive summary.
   */
  static async getExecutiveSummary(ctx: ToolContext) {
    const db = ctx.db;

    // 1. Get Active Simulation (Scoping)
    const activeSim = await db.select()
      .from(simulations)
      .where(and(eq(simulations.organizationId, ctx.orgId), eq(simulations.status, "Approved")))
      .orderBy(desc(simulations.createdAt))
      .limit(1);

    // 2. Get Deficiency Stats
    const defStats = await db.execute(sql`
      SELECT severity, COUNT(*) as count
      FROM deficiencies
      WHERE organization_id = ${ctx.orgId} AND status = 'Open'
      GROUP BY severity
    `);

    // 3. Get Testing Stats
    const testStats = await db.execute(sql`
      SELECT result, COUNT(*) as count
      FROM test_records
      WHERE organization_id = ${ctx.orgId}
      GROUP BY result
    `);

    // 4. Get Missing Controls for Significant Accounts
    const missingControls = await db.execute(sql`
      SELECT g.no_gl, g.gl_desc, g.fsli_name
      FROM gl_rows g
      LEFT JOIN controls c ON c.organization_id = g.organization_id AND (c.fsli_codes ? g.fsli_code)
      WHERE g.snapshot_id = ${activeSim[0]?.glSnapshotId}
      AND g.organization_id = ${ctx.orgId}
      AND (g.balance >= ${activeSim[0]?.pmValue || 0} OR g.category = 'Qualitative')
      AND c.id IS NULL
      LIMIT 10
    `);

    return {
      simulation: activeSim.length > 0 ? {
        name: activeSim[0].name,
        year: activeSim[0].year,
        om: ctx.role === 'Line 1' ? "[RESTRICTED]" : activeSim[0].omValue,
        pm: ctx.role === 'Line 1' ? "[RESTRICTED]" : activeSim[0].pmValue,
      } : null,
      deficiencies: defStats.rows,
      testing: testStats.rows,
      missingControls: missingControls.rows
    };
  }

  /**
   * Cross-module join: Significant Accounts vs Testing Status
   */
  static async getSignificantAccountRisk(ctx: ToolContext) {
    const db = ctx.db;

    // Get significant accounts from latest active simulation
    const activeSim = await db.select()
      .from(simulations)
      .where(and(eq(simulations.organizationId, ctx.orgId), eq(simulations.status, "Approved")))
      .orderBy(desc(simulations.createdAt))
      .limit(1);

    if (activeSim.length === 0) return { error: "No active scoping baseline found." };

    // Query gl_rows that are significant, joined with their controls and test results
    const results = await db.execute(sql`
      SELECT 
        g.no_gl, 
        g.gl_desc, 
        c.code as control_code, 
        c.name as control_name,
        t.result as last_test_result,
        t.test_date
      FROM gl_rows g
      JOIN controls c ON c.organization_id = g.organization_id AND (c.fsli_codes ? g.fsli_code)
      LEFT JOIN (
        SELECT DISTINCT ON (control_id) control_id, result, test_date
        FROM test_records
        WHERE organization_id = ${ctx.orgId}
        ORDER BY control_id, test_date DESC
      ) t ON t.control_id = c.id
      WHERE g.snapshot_id = ${activeSim[0].glSnapshotId}
      AND g.organization_id = ${ctx.orgId}
      AND (g.balance >= ${activeSim[0].pmValue || 0} OR g.category = 'Qualitative')
      ORDER BY g.balance DESC
      LIMIT 20
    `);

    return results.rows;
  }

  /**
   * Checks if all significant accounts have been tested.
   */
  static async checkYearEndReadiness(ctx: ToolContext) {
    const db = ctx.db;

    const activeSim = await db.select()
      .from(simulations)
      .where(and(eq(simulations.organizationId, ctx.orgId), eq(simulations.status, "Approved")))
      .orderBy(desc(simulations.createdAt))
      .limit(1);

    if (activeSim.length === 0) return { error: "No active scoping baseline found." };

    const results = await db.execute(sql`
      SELECT 
        g.fsli_name,
        COUNT(DISTINCT g.no_gl) as total_significant_accounts,
        COUNT(DISTINCT c.id) as total_mapped_controls,
        COUNT(DISTINCT t.control_id) as tested_controls,
        CASE 
          WHEN COUNT(DISTINCT t.control_id) >= COUNT(DISTINCT c.id) AND COUNT(DISTINCT c.id) > 0 THEN 'READY'
          ELSE 'PENDING'
        END as status
      FROM gl_rows g
      JOIN controls c ON c.organization_id = g.organization_id AND (c.fsli_codes ? g.fsli_code)
      LEFT JOIN (
        SELECT DISTINCT control_id FROM test_records WHERE organization_id = ${ctx.orgId}
      ) t ON t.control_id = c.id
      WHERE g.snapshot_id = ${activeSim[0].glSnapshotId}
      AND g.organization_id = ${ctx.orgId}
      AND (g.balance >= ${activeSim[0].pmValue || 0} OR g.category = 'Qualitative')
      GROUP BY g.fsli_name
    `);

    return results.rows;
  }

  /**
   * Calculates deficiency magnitude based on active PM.
   */
  static async calculateDeficiencyMagnitude(ctx: ToolContext, deficiencyId: string) {
    const db = ctx.db;

    const activeSim = await db.select()
      .from(simulations)
      .where(and(eq(simulations.organizationId, ctx.orgId), eq(simulations.status, "Approved")))
      .orderBy(desc(simulations.createdAt))
      .limit(1);

    const def = await db.select()
      .from(deficiencies)
      .where(and(eq(deficiencies.id, deficiencyId), eq(deficiencies.organizationId, ctx.orgId)))
      .limit(1);

    if (def.length === 0) return { error: "Deficiency not found." };
    if (activeSim.length === 0) return { error: "No active simulation found for comparison." };

    const exposure = def[0].exposureValue || 0;
    const pm = activeSim[0].pmValue || 0;

    return {
      exposure,
      pmThreshold: pm,
      isAbovePM: exposure >= pm,
      suggestedSeverity: exposure >= pm ? "Significant Deficiency" : "Control Deficiency",
      rationale: `Exposure value (${exposure}) compared against active PM threshold (${pm}).`
    };
  }

  /**
   * Retrieves WBS indicators for risk assessment.
   */
  static async getWBSIndicators(ctx: ToolContext, departmentId?: string) {
    const db = ctx.db;
    const { wbsReports } = await import("../../db/schema");

    let query = db.select()
      .from(wbsReports)
      .where(eq(wbsReports.organizationId, ctx.orgId))
      .$dynamic();

    if (departmentId) {
      query = query.where(eq(wbsReports.relatedDepartmentId, departmentId));
    }

    const results = await query.orderBy(desc(wbsReports.reportDate)).limit(10);
    return results;
  }
}
