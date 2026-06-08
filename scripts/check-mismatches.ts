import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../worker/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });
const dbUrl = process.env.DATABASE_URL;
const sqlClient = neon(dbUrl!);
const db = drizzle(sqlClient, { schema });

async function run() {
  console.log("Checking for RCM/Control year mismatches with Diagrams...");

  // 1. Check Risks
  const risks = await db.select({
    riskId: schema.rcms.id,
    riskYear: schema.rcms.year,
    riskProcess: schema.rcms.process,
    riskSubProcess: schema.rcms.subProcess,
    diagramId: schema.rcms.diagramId,
    diagramYear: schema.bpmDiagrams.year,
    diagramName: schema.bpmDiagrams.name,
    diagramSubProcess: schema.bpmDiagrams.subProcess
  })
  .from(schema.rcms)
  .leftJoin(schema.bpmDiagrams, eq(schema.rcms.diagramId, schema.bpmDiagrams.id));

  const riskMismatches = risks.filter(r => r.diagramId && (r.riskYear !== r.diagramYear || r.riskSubProcess !== r.diagramSubProcess));
  console.log(`Found ${riskMismatches.length} Risk mismatches.`);
  riskMismatches.forEach(m => {
    if (m.riskYear !== m.diagramYear) {
        console.log(`- Risk ${m.riskId}: Year ${m.riskYear} vs Diagram ${m.diagramYear}`);
    }
    if (m.riskSubProcess !== m.diagramSubProcess) {
        console.log(`- Risk ${m.riskId}: SubProcess '${m.riskSubProcess}' vs Diagram '${m.diagramSubProcess}'`);
    }
  });

  // 2. Check Controls (via bpmProcessId)
  const controls = await db.select({
    controlId: schema.controls.id,
    controlYear: schema.controls.year,
    processId: schema.controls.bpmProcessId,
    processYear: schema.bpmProcesses.year,
    processName: schema.bpmProcesses.name
  })
  .from(schema.controls)
  .leftJoin(schema.bpmProcesses, eq(schema.controls.bpmProcessId, schema.bpmProcesses.id));

  const controlMismatches = controls.filter(c => c.processId && c.controlYear !== c.processYear);
  console.log(`Found ${controlMismatches.length} Control year mismatches.`);
  controlMismatches.forEach(m => {
    console.log(`- Control ${m.controlId}: Year ${m.controlYear} vs Process ${m.processName} (${m.processYear})`);
  });

  // 3. Check for NULLs
  const nullRisks = risks.filter(r => r.riskYear === null);
  console.log(`Found ${nullRisks.length} Risks with NULL year.`);

  const nullControls = controls.filter(c => c.controlYear === null);
  console.log(`Found ${nullControls.length} Controls with NULL year.`);
}

run().catch(console.error);
