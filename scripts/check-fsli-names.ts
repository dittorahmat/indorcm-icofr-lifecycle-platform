import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { glRows, glSnapshots } from '../worker/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function check() {
  const activeSnaps = await db.select().from(glSnapshots).where(eq(glSnapshots.isActive, true));
  const activeSnap = activeSnaps[0];
  const rows = await db.select().from(glRows).where(eq(glRows.snapshotId, activeSnap.id));
  
  const fsliNames = Array.from(new Set(rows.map(r => r.fsliName)));
  console.log('Semua FSLI di database:', fsliNames);
  console.log('Apakah "Kas dan Setara Kas" ada?', fsliNames.includes('Kas dan Setara Kas'));
  
  process.exit(0);
}

check().catch(console.error);
