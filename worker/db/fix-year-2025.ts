import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { bpmDiagrams, rcms, controls, rcmControls, simulations } from './schema';
import * as dotenv from 'dotenv';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(databaseUrl);
const db = drizzle(sql);

async function fix() {
  console.log("Moving all existing data from 2024 to 2025...");

  try {
    // 1. Update Simulations
    await db.update(simulations).set({ year: 2025 });
    console.log(`Updated Simulations to 2025.`);

    // 2. Update BPM Diagrams
    await db.update(bpmDiagrams).set({ year: 2025 });
    console.log(`Updated BPM Diagrams to 2025.`);

    // 3. Update RCMs
    await db.update(rcms).set({ year: 2025 });
    console.log(`Updated RCMs to 2025.`);

    // 4. Update Controls
    await db.update(controls).set({ year: 2025 });
    console.log(`Updated Controls to 2025.`);

    // 5. Update RCM Controls
    await db.update(rcmControls).set({ year: 2025 });
    console.log(`Updated RCM Controls to 2025.`);

    console.log("Database fix completed successfully.");
  } catch (error) {
    console.error("Fix failed:", error);
  }
}

fix();
