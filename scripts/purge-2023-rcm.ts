import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../worker/db/schema';
import { eq, and } from 'drizzle-orm';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env
config({ path: path.resolve(process.cwd(), '.env') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("DATABASE_URL is not set in .env");
  process.exit(1);
}

const sql = neon(dbUrl);
const db = drizzle(sql, { schema });

async function purge2023() {
  console.log("Starting targeted purge of 2023 RCM/BPM data...");
  const yearToPurge = 2023;

  try {
    // We need to delete child records first to avoid foreign key constraint violations
    
    // 1. Delete rcm_controls (mappings)
    console.log("Deleting rcm_controls mappings for 2023...");
    // Find all controls for 2023 and delete their mappings
    const controlsToDelete = await db.select({ id: schema.controls.id }).from(schema.controls).where(eq(schema.controls.year, yearToPurge));
    const controlIds = controlsToDelete.map(c => c.id);
    
    if (controlIds.length > 0) {
      // Drizzle 'inArray' can be used, or just raw SQL for safety. Let's use raw SQL since we have the ids.
      // Actually, rcmControls has a 'year' column if we look at the schema? 
      // Let's just delete controls and let cascade handle it, OR manually delete mappings.
      // In schema.ts, rcmControls is: controlId references controls.id { onDelete: 'cascade' }
      // So deleting controls should delete rcmControls automatically.
    }

    // 2. Delete controls
    console.log("Deleting controls for 2023...");
    const delControls = await db.delete(schema.controls).where(eq(schema.controls.year, yearToPurge));
    console.log(`Deleted controls.`);

    // 3. Delete bpmNodeRcms (mappings)
    // Find all rcms for 2023 to delete node mappings
    console.log("Deleting bpmNodeRcms mappings for 2023...");
    const rcmsToDelete = await db.select({ id: schema.rcms.id }).from(schema.rcms).where(eq(schema.rcms.year, yearToPurge));
    const rcmIds = rcmsToDelete.map(r => r.id);
    // Let cascade handle this too if possible, but let's be explicit if needed.
    // In schema.ts, bpmNodeRcms.rcmId references rcms.id { onDelete: 'cascade' }

    // 4. Delete rcms
    console.log("Deleting rcms for 2023...");
    const delRcms = await db.delete(schema.rcms).where(eq(schema.rcms.year, yearToPurge));
    console.log(`Deleted rcms.`);

    // 5. Delete bpmDiagrams
    console.log("Deleting bpm_diagrams for 2023...");
    const delDiagrams = await db.delete(schema.bpmDiagrams).where(eq(schema.bpmDiagrams.year, yearToPurge));
    console.log(`Deleted bpm_diagrams.`);

    // 6. Delete bpmProcesses
    console.log("Deleting bpm_processes for 2023...");
    const delProcesses = await db.delete(schema.bpmProcesses).where(eq(schema.bpmProcesses.year, yearToPurge));
    console.log(`Deleted bpm_processes.`);

    console.log("✅ Successfully purged only 2023 RCM/BPM data.");
  } catch (error) {
    console.error("Error during purge:", error);
  }
}

purge2023();