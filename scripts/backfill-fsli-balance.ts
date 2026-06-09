import { api } from '../src/lib/api-client';
import * as XLSX from 'xlsx';
import { GLRow } from '../shared/types';
import fs from 'fs';
import path from 'path';

/**
 * BACKFILL SCRIPT: FSLI Balance
 * 
 * This script reads a source Excel file and updates existing gl_rows in the database
 * with the FSLI_Balance value.
 * 
 * Usage: npx tsx scripts/backfill-fsli-balance.ts <excel_file_path> <snapshot_id>
 */

async function backfill() {
  const filePath = process.argv[2];
  const snapshotId = process.argv[3];

  if (!filePath || !snapshotId) {
    console.error("Usage: npx tsx scripts/backfill-fsli-balance.ts <excel_file_path> <snapshot_id>");
    process.exit(1);
  }

  console.log(`Starting backfill for snapshot: ${snapshotId}`);
  console.log(`Source file: ${filePath}`);

  try {
    // 1. Read Excel
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(worksheet) as any[];

    // 2. Extract mapping
    // We need to find No_GL or FSLI Name to map
    const glToFsliBalance = new Map<string, number>();
    
    rawData.forEach(row => {
      const noGL = row['No_GL'];
      const fsliBalance = row['FSLI_Balance'] || row['Saldo_FSLI'] || row['Saldo FSLI'];
      
      if (noGL && fsliBalance !== undefined) {
        glToFsliBalance.set(String(noGL), parseFloat(String(fsliBalance)));
      }
    });

    console.log(`Extracted ${glToFsliBalance.size} mappings from Excel.`);

    // 3. Update Database (via internal maintenance endpoint or direct DB if accessible)
    // For this environment, we'll assume we can use a script that interacts with the DB schema
    // Since I cannot run the full app stack here, I'll provide the logic to be executed.
    
    console.log("Ready to apply updates to database.");
    console.log("This requires a direct DB connection or a maintenance API.");
    
    // In a real scenario, we would do:
    // for (const [noGL, balance] of glToFsliBalance) {
    //   await db.update(glRows).set({ fsliBalance: balance }).where(and(eq(glRows.snapshotId, snapshotId), eq(glRows.noGL, noGL)));
    // }

    console.log("Backfill logic generated successfully.");
  } catch (err) {
    console.error("Backfill failed:", err);
  }
}

// backfill();
console.log("Backfill script template created. Please verify before running.");
