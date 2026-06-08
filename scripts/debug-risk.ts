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
  const rcmId = 'R-754dab73';
  const rcm = await db.select().from(schema.rcms).where(eq(schema.rcms.id, rcmId));
  console.log('Risk:', JSON.stringify(rcm, null, 2));
}
run().catch(console.error);
