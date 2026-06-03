import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../worker/db/schema';
import { eq, and } from 'drizzle-orm';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });
const dbUrl = process.env.DATABASE_URL;
const sqlClient = neon(dbUrl!);
const db = drizzle(sqlClient, { schema });

async function run() {
  const result = await db.select({
      id: schema.rcms.id,
      process: schema.rcms.process,
      year: schema.rcms.year,
      desc: schema.rcms.riskDescription
  }).from(schema.rcms)
  .where(eq(schema.rcms.process, "Pengelolaan Kas"));
  
  console.log(result);
}
run();