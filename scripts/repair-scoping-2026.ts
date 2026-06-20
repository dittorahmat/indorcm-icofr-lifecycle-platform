import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../worker/db/schema';
import { eq, and } from 'drizzle-orm';
import { identifySignificantAccounts } from '../src/pages/scoping/services/materiality-calc';

const url = process.env.DATABASE_URL || "postgres://indouser:indopassword@localhost:5432/indorcm_db";

async function run() {
    console.log("🛠️ Starting scoping repair script...");
    const client = neon(url);
    const db = drizzle(client, { schema });

    // 1. Fetch simulation
    const sims = await db.select().from(schema.simulations).where(
        and(
            eq(schema.simulations.name, "Baseline 2026"),
            eq(schema.simulations.year, 2026)
        )
    );

    if (sims.length === 0) {
        console.error("❌ Simulation 'Baseline 2026' not found.");
        return;
    }

    const sim = sims[0];
    console.log(`✅ Found simulation: ${sim.name} (ID: ${sim.id}, Snapshot: ${sim.glSnapshotId})`);

    if (!sim.glSnapshotId) {
        console.error("❌ Simulation does not have a glSnapshotId.");
        return;
    }

    // 2. Fetch GL rows in snapshot
    const rows = await db.select().from(schema.glRows).where(
        eq(schema.glRows.snapshotId, sim.glSnapshotId)
    );

    console.log(`📊 Loaded ${rows.length} GL rows from snapshot.`);

    // 3. Recalculate significant accounts
    const recalculated = identifySignificantAccounts({
        glData: rows as any[],
        pmValue: sim.pmValue || 0,
        assessmentData: (sim.assessmentData as any) || {}
    });

    console.log(`🔍 Recalculated ${recalculated.length} significant accounts.`);

    // 4. Update the simulation record
    await db.update(schema.simulations)
        .set({
            significantAccounts: recalculated,
            updatedAt: new Date()
        })
        .where(eq(schema.simulations.id, sim.id));

    console.log("🎉 Successfully updated simulation significantAccounts in database!");
    
    // Print out summary of saved significant accounts
    console.log("\nSaved Significant Accounts:");
    recalculated.forEach(sa => {
        console.log(` - name: "${sa.name}", fsliCode: "${sa.fsliCode}", balance: ${sa.balance}, isQuantitative: ${sa.isQuantitative}`);
    });
}

run().catch(console.error);
