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
  const result = await db.execute(`SELECT id, row_count, jsonb_array_length(rows) as rows_length FROM gl_snapshots WHERE id = 'snap_e92a0bqo4bcb7tniti794t'`);
  console.log(result.rows);
}
run();