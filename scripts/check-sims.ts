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
      id: schema.simulations.id,
      name: schema.simulations.name,
      year: schema.simulations.year,
      glSnapshotId: schema.simulations.glSnapshotId
  }).from(schema.simulations).orderBy(schema.simulations.createdAt);
  console.log(JSON.stringify(result, null, 2));
}
run();