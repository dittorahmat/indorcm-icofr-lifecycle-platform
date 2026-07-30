import { getDb } from '../worker/db';
import * as schema from '../worker/db/schema';
import { inArray, eq, sql } from 'drizzle-orm';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("DATABASE_URL is not set in .env");
  process.exit(1);
}

const db = getDb(dbUrl);

async function cleanupOrphanedRcmTlc() {
  console.log("🧹 Checking and cleaning orphaned RCM TLC mappings (data without linked bpm_process)...");

  // Find all rcm_controls mapping IDs that do not link to a valid bpm_process
  const orphanedMappings = await db.execute(sql`
    SELECT rc.id as mapping_id, rc.rcm_id, rc.control_id, r.process as rcm_process
    FROM icofr.rcm_controls rc
    LEFT JOIN icofr.rcms r ON rc.rcm_id = r.id
    LEFT JOIN icofr.bpm_node_rcms bnr ON r.id = bnr.rcm_id
    LEFT JOIN icofr.bpm_diagrams bd ON bnr.diagram_id = bd.id
    LEFT JOIN icofr.bpm_processes bp ON bd.sub_process = bp.name
    WHERE bp.id IS NULL
  `);

  const rows: any[] = (orphanedMappings as any).rows || orphanedMappings;
  console.log(`Found ${rows.length} orphaned RCM TLC mapping rows.`);

  if (rows.length === 0) {
    console.log("✅ No orphaned RCM TLC data found.");
    return;
  }

  const mappingIdsToDelete = Array.from(new Set(rows.map((r: any) => r.mapping_id)));
  const rcmIdsToCheck = Array.from(new Set(rows.map((r: any) => r.rcm_id)));
  const controlIdsToCheck = Array.from(new Set(rows.map((r: any) => r.control_id)));

  console.log(`Deleting ${mappingIdsToDelete.length} orphaned rcm_controls entries...`);
  
  // 1. Delete orphaned rcm_controls mappings
  await db.delete(schema.rcmControls).where(inArray(schema.rcmControls.id, mappingIdsToDelete));
  console.log(`   - Deleted ${mappingIdsToDelete.length} rcm_controls mappings.`);

  // 2. Clean up unreferenced RCMs if any
  for (const rcmId of rcmIdsToCheck) {
    const remainingMappings = await db.select().from(schema.rcmControls).where(eq(schema.rcmControls.rcmId, rcmId));
    if (remainingMappings.length === 0) {
      await db.delete(schema.bpmNodeRcms).where(eq(schema.bpmNodeRcms.rcmId, rcmId));
      await db.delete(schema.rcms).where(eq(schema.rcms.id, rcmId));
      console.log(`   - Deleted orphaned RCM record: ${rcmId}`);
    }
  }

  // 3. Clean up unreferenced Controls if any
  for (const ctrlId of controlIdsToCheck) {
    const remainingMappings = await db.select().from(schema.rcmControls).where(eq(schema.rcmControls.controlId, ctrlId));
    if (remainingMappings.length === 0) {
      await db.delete(schema.controls).where(eq(schema.controls.id, ctrlId));
      console.log(`   - Deleted orphaned Control record: ${ctrlId}`);
    }
  }

  console.log("✨ Cleanup complete! Matriks RCM TLC is now clean of orphaned data.");
}

cleanupOrphanedRcmTlc().catch(console.error);
