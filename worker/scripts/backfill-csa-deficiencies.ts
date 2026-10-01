import * as dotenv from 'dotenv';
dotenv.config();

import { getDb } from '../db';
import { csaRecords, csaSamples, controls, deficiencies, bpmProcesses } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { DeficiencyService } from '../services/deficiency-service';

export async function backfillCsaDeficiencies(databaseUrl?: string) {
  const url = databaseUrl || process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set.');
  }

  const db = getDb(url);
  const defService = new DeficiencyService(db);

  console.log('🔍 [BACKFILL] Scanning for Ineffective CSA records without control_id...');
  const ineffectiveRecords = await db
    .select()
    .from(csaRecords)
    .where(and(
      eq(csaRecords.result, 'Ineffective')
    ));

  console.log(`📋 [BACKFILL] Found ${ineffectiveRecords.length} total Ineffective CSA records.`);

  let totalDeficienciesCreated = 0;
  let totalRecordsProcessed = 0;

  for (const record of ineffectiveRecords) {
    const samples = await db
      .select()
      .from(csaSamples)
      .where(eq(csaSamples.csaRecordId, record.id));

    const failedControlIds = new Set<string>();

    for (const sample of samples) {
      if (sample.controlResults && typeof sample.controlResults === 'object') {
        for (const [ctrlId, val] of Object.entries<any>(sample.controlResults)) {
          if (val && val.implemented === false) {
            failedControlIds.add(ctrlId);
          }
        }
      }
    }

    let bpmProcessName = "Sub-Proses Bisnis";
    if (record.bpmProcessId) {
      const bpm = await db.query.bpmProcesses.findFirst({
        where: eq(bpmProcesses.id, record.bpmProcessId),
        columns: { name: true, noGL: true }
      });
      if (bpm) {
        bpmProcessName = `${bpm.name} (${bpm.noGL})`;
      }
    }

    let description = `Hasil CSA Ineffective untuk proses ${bpmProcessName} (periode ${record.period}).`;
    if (failedControlIds.size > 0) {
      description += ` Kontrol gagal: ${Array.from(failedControlIds).join(', ')}.`;
    }

    console.log(`👉 Record ${record.id} (${record.period}): consolidating ${failedControlIds.size} failed control(s) for ${bpmProcessName}`);

    const defId = await defService.createAutoDeficiency({
      organizationId: record.organizationId,
      controlId: null,
      description,
      source: 'Lini 1 - CSA',
      userId: record.assessedBy || 'SYSTEM',
      period: record.period
    });

    console.log(`   ✅ Created/Verified consolidated deficiency ${defId}`);
    totalDeficienciesCreated++;

    totalRecordsProcessed++;
  }

  console.log(`\n🎉 [BACKFILL COMPLETE] Processed ${totalRecordsProcessed} CSA records. Created/Ensured ${totalDeficienciesCreated} deficiencies.`);
  return { totalRecordsProcessed, totalDeficienciesCreated };
}

// Execute standalone when run directly via CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  backfillCsaDeficiencies()
    .then(() => {
      console.log('Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error during backfill:', err);
      process.exit(1);
    });
}
