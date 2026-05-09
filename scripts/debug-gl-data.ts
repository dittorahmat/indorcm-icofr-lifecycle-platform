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
  const allRows = await db.select().from(glRows);
  console.log('TOTAL GL ROWS IN DATABASE:', allRows.length);

  const snapshots = await db.select().from(glSnapshots);
  console.log(`Checking ${snapshots.length} snapshots...`);

  for (const snap of snapshots) {
    const rows = allRows.filter(r => r.snapshotId === snap.id);
    console.log(`Snapshot: ${snap.filename} (ID: ${snap.id}) - ${rows.length} rows`);

    const counts = new Map<string, number>();
    rows.forEach(r => {
      const key = `${r.noGL}|${r.glDesc}|${r.fsliName}|${Math.round(r.balance)}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    const duplicates = Array.from(counts.entries()).filter(([_, count]) => count > 1);
    // ...

    if (duplicates.length > 0) {
      console.log(`Snapshot: ${snap.filename} (ID: ${snap.id}) - ${snap.isActive ? 'ACTIVE' : 'inactive'}`);
      console.log('  Duplicates found:');
      console.table(duplicates.map(([key, count]) => ({ key, count })));
    }
  }
  
  process.exit(0);
}

debugData().catch(console.error);
