import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { simulations, glRows } from '../worker/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function forceUpdate() {
  console.log('--- FORCING FSLI UPDATE ---');
  
  // 1. Ambil simulasi "Jumlah Pendapatan"
  const simArr = await db.select().from(simulations).where(eq(simulations.name, 'Jumlah Pendapatan'));
  const sim = simArr[0];
  
  if (!sim) {
    console.error('Simulasi "Jumlah Pendapatan" tidak ditemukan.');
    process.exit(1);
  }
  
  // 2. Ambil semua baris GL untuk snapshot ini
  const rows = await db.select().from(glRows).where(eq(glRows.snapshotId, sim.glSnapshotId!));
  
  // 3. Ambil baris Kas
  const kasRows = rows.filter(r => r.fsliName === 'Kas dan Setara Kas');
  console.log(`Ditemukan ${kasRows.length} baris GL untuk FSLI "Kas dan Setara Kas"`);
  
  // 4. Buat objek significantAccounts baru
  const currentAccounts = (sim.significantAccounts as any[]) || [];
  const updatedAccounts = [...currentAccounts];
  
  let addedCount = 0;
  kasRows.forEach(row => {
    // Gunakan noGL sebagai pengenal unik untuk akun
    if (!updatedAccounts.find(sa => sa.fsliCode === row.noGL)) {
      updatedAccounts.push({
        name: 'Kas dan Setara Kas',
        balance: row.balance,
        isQuantitative: false,
        fsliCode: row.noGL,
        assignedDepartmentIds: []
      });
      addedCount++;
    }
  });

  // 5. Update di DB
  await db.update(simulations).set({ significantAccounts: updatedAccounts }).where(eq(simulations.id, sim.id));
  console.log(`Update berhasil. Menambahkan ${addedCount} baris "Kas dan Setara Kas" ke simulasi.`);
  
  process.exit(0);
}

forceUpdate().catch(console.error);
