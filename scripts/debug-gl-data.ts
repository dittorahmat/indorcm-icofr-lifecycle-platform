import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { glRows, glSnapshots } from '../worker/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function debugData() {
  const activeSnaps = await db.select().from(glSnapshots).where(eq(glSnapshots.isActive, true));
  if (activeSnaps.length === 0) {
    console.log("No active snapshot found.");
    process.exit(0);
  }
  
  const activeSnap = activeSnaps[0];
  const rows = await db.select().from(glRows).where(eq(glRows.snapshotId, activeSnap.id));
  
  // Cari semua baris yang mengandung kata 'Kas'
  const kasRows = rows.filter(r => (r.fsliName && r.fsliName.includes('Kas')) || (r.glDesc && r.glDesc.includes('Kas')));
  console.log('Baris yang mengandung "Kas":', kasRows.map(r => ({ fsli: r.fsliName, desc: r.glDesc })));
  
  process.exit(0);
}

debugData().catch(console.error);
