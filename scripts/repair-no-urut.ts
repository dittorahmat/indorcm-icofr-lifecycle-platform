import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { glRows, glSnapshots, simulations } from '../worker/db/schema';
import { eq, and } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import fs from 'fs';
import Papa from 'papaparse';

dotenv.config();

// Try to read from .dev.vars if process.env.DATABASE_URL is missing
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl && fs.existsSync('.dev.vars')) {
  const vars = fs.readFileSync('.dev.vars', 'utf8');
  const match = vars.match(/DATABASE_URL=(.+)/);
  if (match) dbUrl = match[1].trim();
}

if (!dbUrl) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const sql = postgres(dbUrl);
const db = drizzle(sql);

/**
 * Parse Indonesian number format for GL balances
 */
function parseBalance(value: string | number): { success: boolean; value: number; error?: string } {
  if (typeof value === 'number') return { success: true, value };
  if (!value || value.trim() === '' || value === '-') return { success: true, value: 0 };
  let cleaned = value.trim();
  const isNegative = cleaned.startsWith('(') && cleaned.endsWith(')');
  if (isNegative) cleaned = cleaned.slice(1, -1);
  cleaned = cleaned.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return { success: false, value: 0, error: `Invalid balance format: ${value}` };
  return { success: true, value: isNegative ? -parsed : parsed };
}

async function repairNoUrut() {
  console.log("--- REPAIRING NO_URUT FOR EXISTING DATA ---");

  // 1. Get the source CSV data for reference
  const csvPath = 'docs/Template Upload Laporan Keuangan.csv';
  if (!fs.existsSync(csvPath)) {
    console.error(`Source CSV not found at ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const parsed = Papa.parse(csvContent, { 
    header: true, 
    skipEmptyLines: 'greedy',
    delimiter: ';',
    transformHeader: (h) => h.trim() 
  });
  
  const referenceData = parsed.data as any[];
  console.log(`Reference data loaded: ${referenceData.length} rows`);

  // Create a lookup map of queues: key -> number[]
  // Key: noGL | glDesc | fsliName | balance
  const lookup = new Map<string, number[]>();
  
  referenceData.forEach(r => {
    // Correctly access columns using trimmed names
    const parsedBal = parseBalance(r.GL_Balance || '0');
    // Round to nearest integer to avoid float precision issues in keys
    const balanceStr = parsedBal.success ? Math.round(parsedBal.value).toString() : '0';
    
    const key = `${(r.No_GL || '').trim()}|${(r.GL_Desc || '').trim()}|${(r.FSLI || '').trim()}|${balanceStr}`;
    const noUrut = parseInt(r.No_Urut);
    
    if (!isNaN(noUrut)) {
      if (!lookup.has(key)) lookup.set(key, []);
      lookup.get(key)!.push(noUrut);
    }
  });

  console.log(`Lookup map created with ${lookup.size} unique content keys.`);

  // 2. Find all GL Snapshots that need repair
  const snapshots = await db.select().from(glSnapshots);
  console.log(`Found ${snapshots.length} snapshots to process.`);

  for (const snap of snapshots) {
    const allRows = await db.select().from(glRows).where(eq(glRows.snapshotId, snap.id));
    console.log(`Processing snapshot: ${snap.filename} (${allRows.length} rows)`);

    // Clone the lookup for this snapshot to consume queues 1-to-1
    const localLookup = new Map<string, number[]>();
    lookup.forEach((v, k) => localLookup.set(k, [...v]));

    let updateCount = 0;
    let deleteCount = 0;
    let missingMatchCount = 0;

    for (const row of allRows) {
      const balanceStr = Math.round(row.balance || 0).toString();
      const key = `${(row.noGL || '').trim()}|${(row.glDesc || '').trim()}|${(row.fsliName || '').trim()}|${balanceStr}`;
      const queue = localLookup.get(key);

      if (queue && queue.length > 0) {
        const noUrut = queue.shift()!;
        await db.update(glRows)
          .set({ noUrut })
          .where(eq(glRows.id, row.id));
        updateCount++;
      } else {
        if (lookup.has(key)) {
          await db.delete(glRows).where(eq(glRows.id, row.id));
          deleteCount++;
        } else {
          missingMatchCount++;
          if (missingMatchCount <= 3) {
             console.log(`    Mismatch Example - DB Key: "${key}"`);
             // Find closest key in lookup
             const closest = Array.from(lookup.keys()).find(k => k.includes(row.glDesc || ''));
             if (closest) console.log(`                     - Closest CSV: "${closest}"`);
          }
        }
      }
    }
    console.log(`  Result: ${updateCount} updated, ${deleteCount} duplicates deleted, ${missingMatchCount} mismatched.`);
  }

  console.log("--- REPAIR COMPLETE ---");
  process.exit(0);
}

repairNoUrut().catch(console.error);
