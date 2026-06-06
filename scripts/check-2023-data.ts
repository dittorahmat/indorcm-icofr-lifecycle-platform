import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../worker/db/schema';
import { eq, count } from 'drizzle-orm';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(dbUrl);
const db = drizzle(sql, { schema });

async function check2023() {
  console.log("Checking for 2023 data...");
  const year = 2023;

  try {
    const [controlsCount] = await db.select({ value: count() }).from(schema.controls).where(eq(schema.controls.year, year));
    const [rcmsCount] = await db.select({ value: count() }).from(schema.rcms).where(eq(schema.rcms.year, year));
    const [diagramsCount] = await db.select({ value: count() }).from(schema.bpmDiagrams).where(eq(schema.bpmDiagrams.year, year));
    const [processesCount] = await db.select({ value: count() }).from(schema.bpmProcesses).where(eq(schema.bpmProcesses.year, year));

    console.log(`Results for year ${year}:`);
    console.log(`- Controls: ${controlsCount.value}`);
    console.log(`- RCMs: ${rcmsCount.value}`);
    console.log(`- BPM Diagrams: ${diagramsCount.value}`);
    console.log(`- BPM Processes: ${processesCount.value}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

check2023();
