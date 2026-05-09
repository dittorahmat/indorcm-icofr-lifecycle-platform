import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { simulations, glSnapshots, glRows } from '../worker/db/schema';
import { eq, and } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function audit() {
  console.log('--- AUDIT FSLI SIGNIFICANCE ---');
  
  // 1. Get active simulation
  const activeSims = await db.select().from(simulations).where(eq(simulations.status, 'Approved'));
  if (activeSims.length === 0) {
    console.error('No approved simulation found.');
    return;
  }
  const active = activeSims[0];
  console.log('Simulasi aktif:', active.name);
  console.log('PM Value:', active.pmValue);

  // 2. Get active snapshot
  const activeSnaps = await db.select().from(glSnapshots).where(eq(glSnapshots.isActive, true));
  if (activeSnaps.length === 0) {
    console.error('No active snapshot found.');
    return;
  }
  const activeSnap = activeSnaps[0];
  
  // 3. Get rows for "Kas dan Setara Kas"
  const rows = await db.select().from(glRows).where(eq(glRows.snapshotId, activeSnap.id));
  const kasRows = rows.filter((r: any) => r.fsliName === 'Kas dan Setara Kas');
  const totalBalance = kasRows.reduce((sum: number, r: any) => sum + Math.abs(r.balance || 0), 0);
  
  console.log('Total saldo "Kas dan Setara Kas":', totalBalance);
  console.log('Apakah >= PM?', totalBalance >= (active.pmValue || 0));
  console.log('Assessment Data untuk FSLI ini:', (active.assessmentData as any)?.['Kas dan Setara Kas']);
  
  process.exit(0);
}

audit().catch(console.error);
