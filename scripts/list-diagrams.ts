import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../worker/db/schema';
import { eq } from 'drizzle-orm';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });
const dbUrl = process.env.DATABASE_URL;
const sqlClient = neon(dbUrl!);
const db = drizzle(sqlClient, { schema });

async function run() {
  const diags = await db.select().from(schema.bpmDiagrams);
  console.log('Diagrams:', JSON.stringify(diags.map(d => ({ id: d.id, name: d.name, year: d.year, subProcess: d.subProcess })), null, 2));
}
run().catch(console.error);
