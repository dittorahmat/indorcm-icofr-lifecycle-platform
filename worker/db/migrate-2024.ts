import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { bpmDiagrams, rcms, controls, rcmControls } from './schema';
import { isNull } from 'drizzle-orm';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(databaseUrl);
const db = drizzle(sql);

async function migrate() {
  console.log("Starting migration to set default year 2024 for existing records...");

  try {
    // Update BPM Diagrams
    await db.update(bpmDiagrams)
      .set({ year: 2024 })
      .where(isNull(bpmDiagrams.year));
    console.log(`Updated BPM Diagrams.`);

    // Update RCMs
    await db.update(rcms)
      .set({ year: 2024 })
      .where(isNull(rcms.year));
    console.log(`Updated RCMs.`);

    // Update Controls
    await db.update(controls)
      .set({ year: 2024 })
      .where(isNull(controls.year));
    console.log(`Updated Controls.`);

    // Update RCM Controls Mapping
    await db.update(rcmControls)
      .set({ year: 2024 })
      .where(isNull(rcmControls.year));
    console.log(`Updated RCM Controls.`);

    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

migrate();
