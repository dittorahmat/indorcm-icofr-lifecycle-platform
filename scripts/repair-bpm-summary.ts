import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../worker/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';

const url = process.env.DATABASE_URL!;

async function repair() {
    if (!url) {
        console.error("❌ DATABASE_URL is not set. Please provide it via environment variable.");
        return;
    }

    const client = neon(url);
    const db = drizzle(client, { schema });

    console.log("🔍 Starting BPM Summary Repair & Cleanup...");

    // --- STEP 1: Cleanup Ghost Mappings in rcm_controls ---
    console.log("\n--- STEP 1: Cleaning up Ghost Mappings ---");
    
    // Find mappings where control_id doesn't exist in controls table
    const ghostMappings = await db.execute(sql`
        SELECT rc.id, rc.control_id, rc.control_name 
        FROM rcm_controls rc
        LEFT JOIN controls c ON rc.control_id = c.id
        WHERE c.id IS NULL
    `);
    
    const ghostRows = ghostMappings.rows || ghostMappings;
    console.log(`Found ${ghostRows.length} ghost mappings.`);

    if (ghostRows.length > 0) {
        const idsToDelete = ghostRows.map((r: any) => r.id);
        await db.delete(schema.rcmControls).where(inArray(schema.rcmControls.id, idsToDelete));
        console.log(`✅ Deleted ${idsToDelete.length} ghost mappings.`);
    }

    // --- STEP 2: Audit & Recalculate per Sub-Process ---
    console.log("\n--- STEP 2: Recalculating Process Summaries ---");

    const processes = await db.select().from(schema.bpmProcesses);
    console.log(`Processing ${processes.length} BPM processes...`);

    for (const proc of processes) {
        console.log(`\nChecking Process: ${proc.name} (GL: ${proc.noGL})`);

        // Find the latest diagram for this sub-process
        const diags = await db.select()
            .from(schema.bpmDiagrams)
            .where(eq(schema.bpmDiagrams.subProcess, proc.name))
            .orderBy(sql`updated_at DESC NULLS LAST`)
            .limit(1);

        if (diags.length === 0) {
            console.log(` ⚠️ No diagram found for "${proc.name}". Skipping summary update.`);
            continue;
        }

        const diag = diags[0];
        console.log(` Found Diagram: ${diag.id} (Updated: ${diag.updatedAt})`);

        // 1. Get unique Risks linked to this diagram (Source: bpmNodeRcms)
        const linkedRisks = await db.select({ id: schema.bpmNodeRcms.rcmId })
            .from(schema.bpmNodeRcms)
            .where(eq(schema.bpmNodeRcms.diagramId, diag.id))
            .groupBy(schema.bpmNodeRcms.rcmId);
        
        const riskCount = linkedRisks.length;
        const uniqueRiskIds = linkedRisks.map((r: any) => r.id);
        
        let controlCount = 0;
        if (uniqueRiskIds.length > 0) {
            // 2. Get unique Controls linked to those Risks (Source: rcmControls)
            const linkedCtrls = await db.select({ id: schema.rcmControls.controlId })
                .from(schema.rcmControls)
                .where(and(
                    inArray(schema.rcmControls.rcmId, uniqueRiskIds),
                    eq(schema.rcmControls.organizationId, proc.organizationId)
                ))
                .groupBy(schema.rcmControls.controlId);
            controlCount = linkedCtrls.length;
        }

        console.log(` Calculated: ${riskCount} Risks, ${controlCount} Controls.`);

        if (proc.riskCount !== riskCount || proc.controlCount !== controlCount) {
            await db.update(schema.bpmProcesses)
                .set({ riskCount, controlCount })
                .where(eq(schema.bpmProcesses.id, proc.id));
            console.log(` ✅ UPDATED summary from (${proc.riskCount}/${proc.controlCount}) to (${riskCount}/${controlCount})`);
        } else {
            console.log(` ✨ Summary already accurate.`);
        }
    }

    console.log("\n🎉 Repair process completed successfully!");
}

repair().catch(e => {
    console.error("❌ Fatal Error during repair:", e);
    process.exit(1);
});
