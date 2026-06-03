import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../worker/db/schema';
import { eq, and, sql as dSQL } from 'drizzle-orm';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });
const dbUrl = process.env.DATABASE_URL;
const sqlClient = neon(dbUrl!);
const db = drizzle(sqlClient, { schema });

async function run() {
  const orgId = "org-bumn-default";
  const bpmProcessId = "proc_y8q6z5gcjxg3mjjd7norf";
  const year = "2023";

  let query = db.select({
    mappingId: schema.rcmControls.id,
    controlId: schema.controls.id,
    processName: dSQL<string>`COALESCE(${schema.bpmProcesses.name}, ${schema.rcms.process})`,
  })
  .from(schema.rcmControls)
  .innerJoin(schema.rcms, eq(schema.rcmControls.rcmId, schema.rcms.id))
  .innerJoin(schema.controls, eq(schema.rcmControls.controlId, schema.controls.id))
  .leftJoin(schema.bpmNodeRcms, eq(schema.rcms.id, schema.bpmNodeRcms.rcmId))
  .leftJoin(schema.bpmDiagrams, eq(schema.bpmNodeRcms.diagramId, schema.bpmDiagrams.id))
  .leftJoin(schema.bpmProcesses, eq(schema.bpmDiagrams.subProcess, schema.bpmProcesses.name));

  let finalConditions = and(
    eq(schema.rcmControls.organizationId, orgId),
    eq(schema.controls.level, 'TLC')
  );

  finalConditions = and(finalConditions, eq(schema.controls.bpmProcessId, bpmProcessId)) as any;
  finalConditions = and(finalConditions, eq(schema.rcms.year, parseInt(year))) as any;

  const results = await query.where(finalConditions);
  console.log(results);
}
run();