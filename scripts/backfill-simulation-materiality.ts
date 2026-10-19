import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { getDb } from '../worker/db';
import * as schema from '../worker/db/schema';
import { computeSimulationMateriality } from '@shared/scoping-materiality';

/**
 * One-off repair (SK-5/DKU.MBU/11/2024):
 * 1. Snapshots that claim `Mapped` but carry no benchmark FSLI list get their
 *    candidates derived from the rows (largest |balance| first, any basis a
 *    simulation already uses hoisted in front) so the create form is usable.
 * 2. Simulations with a snapshot but a missing/zero PM get their OM/PM and
 *    significant accounts recomputed through the shared materiality seam.
 *
 * Idempotent: rows already correct are skipped. Run with DATABASE_URL set.
 */

const assessmentDataOf = (value: unknown): Record<string, Record<number, string>> | undefined =>
  value && typeof value === 'object' ? (value as Record<string, Record<number, string>>) : undefined;

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('⚠️ DATABASE_URL is missing. Skipping backfill (no active DB connection string).');
    return;
  }

  const db = getDb(databaseUrl);
  console.log('🛠️ Backfilling scoping materiality (snapshot benchmarks + simulation PM)...');

  const snapshots = await db.select().from(schema.glSnapshots);
  const simulations = await db.select().from(schema.simulations);

  const benchmarksBySnapshot = new Map<string, string[]>();
  let snapshotsFixed = 0;

  // Pass 1 — snapshots whose status lies about having a benchmark.
  for (const snap of snapshots) {
    const existing = (snap.benchmarkFsliNames as string[] | null) ?? [];
    if (existing.length > 0) {
      benchmarksBySnapshot.set(snap.id, existing);
      continue;
    }

    const rows = await db.select({ fsliName: schema.glRows.fsliName, balance: schema.glRows.balance })
      .from(schema.glRows)
      .where(eq(schema.glRows.snapshotId, snap.id));

    const totals = new Map<string, number>();
    for (const r of rows) {
      if (!r.fsliName) continue;
      totals.set(r.fsliName, (totals.get(r.fsliName) ?? 0) + Math.abs(r.balance ?? 0));
    }
    const ordered = [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);

    const bases = simulations
      .filter((s) => s.glSnapshotId === snap.id && s.basis)
      .map((s) => s.basis as string);
    const benchmarkFsliNames = [...new Set([...bases, ...ordered])];

    if (benchmarkFsliNames.length === 0) {
      console.log(`⏩ Snapshot '${snap.filename}' has no FSLI rows — left as '${snap.status}'.`);
      continue;
    }

    await db.update(schema.glSnapshots)
      .set({ benchmarkFsliNames })
      .where(eq(schema.glSnapshots.id, snap.id));

    benchmarksBySnapshot.set(snap.id, benchmarkFsliNames);
    snapshotsFixed++;
    console.log(`✅ Snapshot '${snap.filename}': ${benchmarkFsliNames.length} benchmark FSLI(s) derived.`);
  }

  // Pass 2 — simulations whose stored PM never got derived.
  let simulationsFixed = 0;

  for (const sim of simulations) {
    if (!sim.glSnapshotId || sim.pmValue) continue;
    if (!sim.basis) {
      console.log(`⏩ Simulation '${sim.name}' has no basis — skipped.`);
      continue;
    }

    const rows = await db.select().from(schema.glRows).where(eq(schema.glRows.snapshotId, sim.glSnapshotId));
    const benchmarks = benchmarksBySnapshot.get(sim.glSnapshotId) ?? [];
    const knownBasis = benchmarks.includes(sim.basis) || rows.some((r) => r.fsliName === sim.basis);
    if (!knownBasis) {
      console.log(`⏩ Simulation '${sim.name}': basis '${sim.basis}' not found in its snapshot — skipped.`);
      continue;
    }

    const materiality = computeSimulationMateriality({
      rows,
      basis: sim.basis,
      omPercentage: sim.omPercentage ?? 5,
      haircutPercentage: sim.haircutPercentage ?? 25,
      locationCount: sim.locationCount ?? 1,
      assessmentData: assessmentDataOf(sim.assessmentData),
    });

    await db.update(schema.simulations)
      .set({
        omValue: materiality.omValue,
        pmValue: materiality.pmValue,
        significantAccounts: materiality.significantAccounts,
        updatedAt: new Date(),
      })
      .where(eq(schema.simulations.id, sim.id));

    simulationsFixed++;
    console.log(`✅ Simulation '${sim.name}': PM ${materiality.pmValue} (${materiality.significantAccounts.length} significant account(s)).`);
  }

  console.log(`\n🎉 Backfill complete — ${snapshotsFixed} snapshot(s), ${simulationsFixed} simulation(s) updated.`);
}

run().catch((err) => {
  console.error('❌ Backfill failed:', err);
  process.exitCode = 1;
});
