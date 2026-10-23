import { sql, type SQL } from 'drizzle-orm';

/**
 * The child-to-parent delete order for purging orphaned controls. One owner:
 * the nine statements (and their order) used to sit inline in `cleanupStaleData`,
 * where a schema rename was invisible to `tsc` and the list could not be tested.
 *
 * Order is load-bearing: every child table must be cleared before its parent
 * (`action_plans` before `deficiencies`, samples before records, mappings before
 * `controls` last).
 */
export function controlCascadeStatements(orgId: string, controlIds: readonly string[]): SQL[] {
  if (controlIds.length === 0) return [];
  const idList = sql.join(controlIds.map((id) => sql`${id}`), sql`, `);

  return [
    sql`DELETE FROM action_plans WHERE organization_id = ${orgId} AND deficiency_id IN (SELECT id FROM deficiencies WHERE organization_id = ${orgId} AND control_id IN (${idList}))`,
    sql`DELETE FROM deficiencies WHERE organization_id = ${orgId} AND control_id IN (${idList})`,
    sql`DELETE FROM tod_evaluations WHERE organization_id = ${orgId} AND control_id IN (${idList})`,
    sql`DELETE FROM csa_samples WHERE organization_id = ${orgId} AND csa_record_id IN (SELECT id FROM csa_records WHERE organization_id = ${orgId} AND control_id IN (${idList}))`,
    sql`DELETE FROM csa_records WHERE organization_id = ${orgId} AND control_id IN (${idList})`,
    sql`DELETE FROM test_samples WHERE organization_id = ${orgId} AND test_record_id IN (SELECT id FROM test_records WHERE organization_id = ${orgId} AND control_id IN (${idList}))`,
    sql`DELETE FROM test_records WHERE organization_id = ${orgId} AND control_id IN (${idList})`,
    sql`DELETE FROM rcm_controls WHERE organization_id = ${orgId} AND control_id IN (${idList})`,
    sql`DELETE FROM controls WHERE organization_id = ${orgId} AND id IN (${idList})`,
  ];
}

export const CONTROL_CASCADE_STATEMENT_COUNT = 9;
