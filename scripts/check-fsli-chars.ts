import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { glRows, glSnapshots } from '../worker/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function checkChars() {
  const activeSnaps = await db.select().from(glSnapshots).where(eq(glSnapshots.isActive, true));
  if (activeSnaps.length === 0) {
    console.log("No active snapshot found.");
    process.exit(0);
  }
  
  const rows = await db.select().from(glRows).where(eq(glRows.snapshotId, activeSnaps[0].id));
  
  const kas = rows.find(r => r.fsliName && r.fsliName.includes('Kas'));
  if (kas) {
    console.log('Original String:', kas.fsliName);
    console.log('JSON Stringified:', JSON.stringify(kas.fsliName));
    console.log('Char codes:', Array.from(kas.fsliName!).map(c => `${c}:${c.charCodeAt(0)}`));
  } else {
    console.log('FSLI containing "Kas" not found.');
  }
  
  process.exit(0);
}

checkChars().catch(console.error);
