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

async function fixDiag() {
  const diags = await db.select().from(schema.bpmDiagrams).where(isNull(schema.bpmDiagrams.year));
  console.log(`Found ${diags.length} diagrams with null year`);
  for (const d of diags) {
    await db.update(schema.bpmDiagrams).set({ year: 2026 }).where(eq(schema.bpmDiagrams.id, d.id));
    console.log(`Updated diagram ${d.name} to 2026`);
  }
}
fixDiag().catch(console.error);
