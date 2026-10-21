import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../worker/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("DATABASE_URL must be defined");
    process.exit(1);
}
const sqlClient = neon(dbUrl);
const db = drizzle(sqlClient, { schema });

async function backfill() {
  console.log("🚀 Starting robust RCM-TLC backfill script...");

  // 1. Assign missing years to BPMProcess records based on their Diagrams
  const processesWithNullYear = await db.select().from(schema.bpmProcesses).where(isNull(schema.bpmProcesses.year));
  console.log(`Found ${processesWithNullYear.length} BPMProcesses with NULL year.`);
  
  let processesUpdated = 0;
  for (const proc of processesWithNullYear) {
    // Try to find a diagram matching the process name to infer the year
    const diagram = await db.select()
        .from(schema.bpmDiagrams)
        .where(eq(schema.bpmDiagrams.subProcess, proc.name))
        .limit(1);
        
    let inferredYear = 2026; // Default fallback for entirely detached/legacy processes
    if (diagram.length > 0 && diagram[0].year) {
        inferredYear = diagram[0].year;
    }
    
    await db.update(schema.bpmProcesses)
        .set({ year: inferredYear })
        .where(eq(schema.bpmProcesses.id, proc.id));
    processesUpdated++;
  }
  console.log(`✅ Updated ${processesUpdated} BPMProcess records with inferred years.`);

  // 2. Align rcms.year with their parent diagrams
  const allRisks = await db.select().from(schema.rcms);
  let risksUpdated = 0;
  for (const risk of allRisks) {
      if (risk.diagramId) {
          const diag = await db.select().from(schema.bpmDiagrams).where(eq(schema.bpmDiagrams.id, risk.diagramId)).limit(1);
          if (diag.length > 0) {
              const diagYear = diag[0].year || 2026;
              const diagramSubProcess = diag[0].subProcess;
              // Also update process/subProcess if they don't match the diagram to enforce consistency
              if (risk.year !== diagYear || risk.process !== diag[0].name || (diagramSubProcess !== null && risk.subProcess !== diagramSubProcess)) {
                  await db.update(schema.rcms)
                    .set({ year: diagYear, process: diag[0].name, ...(diagramSubProcess === null ? {} : { subProcess: diagramSubProcess }) })
                    .where(eq(schema.rcms.id, risk.id));
                  risksUpdated++;
              }
          }
      } else if (risk.year === null) {
          await db.update(schema.rcms).set({ year: 2026 }).where(eq(schema.rcms.id, risk.id));
          risksUpdated++;
      }
  }
  console.log(`✅ Updated ${risksUpdated} Risk records to match diagram metadata.`);

  // 3. Align controls.year and bpmProcessId linkage
  const allControls = await db.select().from(schema.controls);
  let controlsUpdated = 0;
  for (const ctrl of allControls) {
      let needsUpdate = false;
      let updateData: any = {};

      if (ctrl.bpmProcessId) {
          // Verify linkage and year
          const proc = await db.select().from(schema.bpmProcesses).where(eq(schema.bpmProcesses.id, ctrl.bpmProcessId)).limit(1);
          if (proc.length > 0) {
             if (ctrl.year !== proc[0].year) {
                 updateData.year = proc[0].year;
                 needsUpdate = true;
             }
             if (ctrl.subProcess !== proc[0].name) {
                 updateData.subProcess = proc[0].name;
                 updateData.businessProcess = proc[0].name; // For now
                 needsUpdate = true;
             }
          }
      } else if (ctrl.year === null) {
         updateData.year = 2026;
         needsUpdate = true;
      }

      if (needsUpdate) {
          await db.update(schema.controls).set(updateData).where(eq(schema.controls.id, ctrl.id));
          controlsUpdated++;
      }
  }
  console.log(`✅ Updated ${controlsUpdated} Control records to match process metadata.`);

  console.log("🎉 Backfill complete!");
}

backfill().catch(console.error);