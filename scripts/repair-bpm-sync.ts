import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../worker/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("DATABASE_URL is not set in .env");
  process.exit(1);
}

const sqlClient = neon(dbUrl);
const db = drizzle(sqlClient, { schema });

async function run() {
  console.log("🚀 Starting BPM-RCM Data Repair Script...");

  // 1. Repair RCMS
  const orphanedRisks = await db.select().from(schema.rcms).where(isNull(schema.rcms.year));
  console.log(`Found ${orphanedRisks.length} Risks with NULL year.`);

  for (const risk of orphanedRisks) {
    let targetYear = 2026; // Default fallback
    
    // Try to find year from linked diagram
    if (risk.diagramId) {
      const diag = await db.select().from(schema.bpmDiagrams).where(eq(schema.bpmDiagrams.id, risk.diagramId)).limit(1);
      if (diag.length > 0 && diag[0].year) {
        targetYear = diag[0].year;
      }
    }

    await db.update(schema.rcms)
      .set({ year: targetYear })
      .where(eq(schema.rcms.id, risk.id));
    
    console.log(`✅ Updated Risk ${risk.id} to year ${targetYear}`);
  }

  // 2. Repair CONTROLS
  const orphanedControls = await db.select().from(schema.controls).where(isNull(schema.controls.year));
  console.log(`Found ${orphanedControls.length} Controls with NULL year.`);

  for (const ctrl of orphanedControls) {
    let targetYear = 2026;
    let targetProcessId = ctrl.bpmProcessId;

    // Try to resolve bpmProcessId and year if missing
    if (!targetProcessId || !ctrl.year) {
      const matchedProcesses = await db.select().from(schema.bpmProcesses)
        .where(and(
          eq(schema.bpmProcesses.organizationId, ctrl.organizationId),
          ctrl.subProcess ? sql`TRIM(LOWER(${schema.bpmProcesses.name})) = TRIM(LOWER(${ctrl.subProcess}))` : sql`1=0`
        )).limit(1);
      
      if (matchedProcesses.length > 0) {
        targetProcessId = matchedProcesses[0].id;
        targetYear = matchedProcesses[0].year || 2026;
      }
    }

    await db.update(schema.controls)
      .set({ 
        year: ctrl.year || targetYear,
        bpmProcessId: targetProcessId
      })
      .where(eq(schema.controls.id, ctrl.id));
    
    console.log(`✅ Updated Control ${ctrl.id} (Process: ${ctrl.subProcess}) to year ${targetYear}`);
  }

  // 3. Special check for "Penerimaan Setoran Tunai" GL 10008-000318
  console.log("\n🔍 Specific check for 'Penerimaan Setoran Tunai'...");
  const targetProcess = await db.select().from(schema.bpmProcesses)
    .where(eq(schema.bpmProcesses.noGL, '10008-000318'))
    .limit(1);

  if (targetProcess.length > 0) {
    const p = targetProcess[0];
    console.log(`Found Process: ${p.name} (ID: ${p.id}, Year: ${p.year})`);

    // Force link any risks/controls that match the subProcess name but lack the ID or Year
    const rUpdate = await db.update(schema.rcms)
      .set({ year: p.year })
      .where(and(
        eq(schema.rcms.subProcess, p.name),
        isNull(schema.rcms.year)
      ));
    
    const cUpdate = await db.update(schema.controls)
      .set({ 
        year: p.year,
        bpmProcessId: p.id
      })
      .where(and(
        eq(schema.controls.subProcess, p.name),
        sql`(${schema.controls.year} IS NULL OR ${schema.controls.bpmProcessId} IS NULL)`
      ));
    
    console.log(`Force repaired risks/controls matching process name.`);
  }

  console.log("\n✨ Repair complete. Please check the RCM TLC tab again.");
}

run().catch(err => {
  console.error("❌ Repair failed:", err);
  process.exit(1);
});
