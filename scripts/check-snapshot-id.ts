import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { simulations, glSnapshots } from '../worker/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function checkIds() {
  console.log('--- CHECKING SIMULATION SNAPSHOT ID ---');
  
  // Get active snapshot
  const activeSnaps = await db.select().from(glSnapshots).where(eq(glSnapshots.isActive, true));
  const activeSnap = activeSnaps[0];
  console.log('Active Snapshot ID:', activeSnap?.id);

  // Get active simulation ("Jumlah Pendapatan")
  const sim = await db.select().from(simulations).where(eq(simulations.name, 'Jumlah Pendapatan'));
  const activeSim = sim[0];
  console.log('Simulation "Jumlah Pendapatan" Snapshot ID:', activeSim?.glSnapshotId);
  
  if (activeSnap?.id !== activeSim?.glSnapshotId) {
    console.log('Mismatch detected! The simulation is using an old snapshot.');
  } else {
    console.log('Snapshot IDs match.');
  }
  
  process.exit(0);
}

checkIds().catch(console.error);
