import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { getDb } from '../worker/db';
import * as schema from '../worker/db/schema';
import { getQualitativeDefaults } from '../worker/services/scoping-defaults';

async function run() {
  console.log("🛠️ Starting scoping qualitative assertions backfill script...");
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log("⚠️ DATABASE_URL is missing. Skipping script execution (no active DB connection string).");
    return;
  }

  const db = getDb(databaseUrl);

  try {
    // Fetch all simulations
    const sims = await db.select().from(schema.simulations);
    console.log(`📊 Found ${sims.length} simulations in total.`);

    let updatedCount = 0;

    for (const sim of sims) {
      let currentAssessment: Record<string, any> = (sim.assessmentData as Record<string, any>) || {};

      if (!sim.glSnapshotId) {
        console.log(`⏩ Skipping simulation '${sim.name}' (ID: ${sim.id}) - No glSnapshotId attached.`);
        continue;
      }

      // Fetch unique FSLIs for this snapshot
      const rows = await db.select({ fsliName: schema.glRows.fsliName })
        .from(schema.glRows)
        .where(eq(schema.glRows.snapshotId, sim.glSnapshotId));

      const uniqueFslis = Array.from(new Set(rows.map(r => r.fsliName).filter(Boolean) as string[]));

      let modified = false;
      const updatedAssessment = { ...currentAssessment };

      uniqueFslis.forEach(fsli => {
        if (!updatedAssessment[fsli]) {
          updatedAssessment[fsli] = getQualitativeDefaults(fsli);
          modified = true;
        } else {
          // Ensure all 8 pillars exist
          const defaultForFsli = getQualitativeDefaults(fsli);
          const existingForFsli = updatedAssessment[fsli] || {};
          let fsliModified = false;
          for (let p = 1; p <= 8; p++) {
            if (!existingForFsli[p] && !existingForFsli[String(p)]) {
              existingForFsli[p] = defaultForFsli[p] || "Low";
              fsliModified = true;
            }
          }
          if (fsliModified) {
            updatedAssessment[fsli] = existingForFsli;
            modified = true;
          }
        }
      });

      if (modified) {
        await db.update(schema.simulations)
          .set({
            assessmentData: updatedAssessment,
            updatedAt: new Date()
          })
          .where(eq(schema.simulations.id, sim.id));

        console.log(`✅ Backfilled assessmentData for simulation '${sim.name}' (ID: ${sim.id}) with ${uniqueFslis.length} FSLIs.`);
        updatedCount++;
      } else {
        console.log(`ℹ️ Simulation '${sim.name}' (ID: ${sim.id}) is already fully populated.`);
      }
    }

    console.log(`\n🎉 Backfill complete! Updated ${updatedCount} simulation(s).`);
  } catch (err: any) {
    console.warn("⚠️ Backfill execution completed with warning:", err.message || err);
  }
}

run().catch(console.error);
