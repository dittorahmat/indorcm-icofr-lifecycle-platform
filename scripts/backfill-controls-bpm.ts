import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { createDbAndPool } from '../worker/db';
import * as schema from '../worker/db/schema';

// Load .env
config({ path: path.resolve(process.cwd(), '.env') });
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("❌ DATABASE_URL is not set in environment or .env file.");
  process.exit(1);
}

const isDryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');
const isApply = process.argv.includes('--apply');

async function main() {
  console.log("================================================================================");
  console.log(" 🛠️  BPM CONTROLS BACKFILL SCRIPT (NEON TECH & ON-PREMISES POSTGRESQL)");
  console.log("================================================================================");
  console.log(`📡 Mode: ${isApply ? '🚀 APPLY MUTATIONS' : '🔍 DRY RUN (Simulasi, tidak mengubah data)'}`);
  console.log(`🔗 Database target: ${dbUrl.replace(/:[^:@]*@/, ':****@')}`);
  console.log("================================================================================\n");

  const { db } = createDbAndPool(dbUrl);

  // 1. Fetch all controls where bpmProcessId is null or empty
  const unlinkedControls = await db.select().from(schema.controls).where(
    sql`${schema.controls.bpmProcessId} IS NULL OR ${schema.controls.bpmProcessId} = ''`
  );

  console.log(`📊 Found ${unlinkedControls.length} controls needing BPM linkage resolution.`);

  if (unlinkedControls.length === 0) {
    console.log("🎉 All controls already have valid bpmProcessId! No backfill needed.");
    process.exit(0);
  }

  // 2. Fetch all bpm processes and diagrams for mapping
  const allBpmProcesses = await db.select().from(schema.bpmProcesses);
  const allDiagrams = await db.select().from(schema.bpmDiagrams);
  const allRcmControls = await db.select().from(schema.rcmControls);
  const allRcms = await db.select().from(schema.rcms);
  const allNodeRcms = await db.select().from(schema.bpmNodeRcms);

  console.log(`📚 Indexed ${allBpmProcesses.length} BPM Processes and ${allDiagrams.length} BPM Diagrams.\n`);

  let matchedExact = 0;
  let matchedDiagram = 0;
  let matchedNameOnly = 0;
  let unmatchedCount = 0;

  const plannedUpdates: Array<{
    controlId: string;
    controlCode: string;
    controlName: string;
    subProcess: string;
    targetProcessId: string;
    targetProcessName: string;
    matchType: string;
  }> = [];

  const unmatchedList: Array<{
    id: string;
    code: string;
    name: string;
    subProcess?: string | null;
    businessProcess?: string | null;
    fsliCodes?: any;
    organizationId: string;
  }> = [];

  for (const ctrl of unlinkedControls) {
    const ctrlSub = (ctrl.subProcess || '').trim().toLowerCase();
    const ctrlFsliCodes = Array.isArray(ctrl.fsliCodes) ? ctrl.fsliCodes : [];

    let targetProcess: typeof allBpmProcesses[0] | undefined;
    let matchType = '';

    // Strategy 1: Match SubProcess Name AND GL (noGL in fsliCodes) within same Organization
    if (ctrlSub) {
      targetProcess = allBpmProcesses.find(p => {
        if (p.organizationId !== ctrl.organizationId) return false;
        const pName = (p.name || '').trim().toLowerCase();
        if (pName !== ctrlSub) return false;

        // Check if GL matches
        if (p.noGL && ctrlFsliCodes.includes(p.noGL)) return true;
        return false;
      });

      if (targetProcess) {
        matchType = 'EXACT_SUBPROCESS_AND_GL';
        matchedExact++;
      }
    }

    // Strategy 2: Trace via RCM -> Diagram Linkage
    if (!targetProcess) {
      // Find rcm_controls mapping for this control
      const rcmCtrl = allRcmControls.find(rc => rc.controlId === ctrl.id);
      if (rcmCtrl) {
        // Find node linkage to diagram
        const nodeLink = allNodeRcms.find(nr => nr.rcmId === rcmCtrl.rcmId);
        if (nodeLink) {
          const diag = allDiagrams.find(d => d.id === nodeLink.diagramId);
          if (diag) {
            // Find bpm process with diagram name / subprocess
            const foundProc = allBpmProcesses.find(p => 
              p.organizationId === ctrl.organizationId &&
              (p.name?.trim().toLowerCase() === diag.subProcess?.trim().toLowerCase() ||
               p.name?.trim().toLowerCase() === diag.name?.trim().toLowerCase())
            );
            if (foundProc) {
              targetProcess = foundProc;
              matchType = 'BPM_DIAGRAM_RELATION';
              matchedDiagram++;
            }
          }
        }
      }
    }

    // Strategy 3: SubProcess Name match within same org (if uniquely 1 exists)
    if (!targetProcess && ctrlSub) {
      const candidates = allBpmProcesses.filter(p => 
        p.organizationId === ctrl.organizationId &&
        (p.name || '').trim().toLowerCase() === ctrlSub
      );

      if (candidates.length === 1) {
        targetProcess = candidates[0];
        matchType = 'UNIQUE_SUBPROCESS_NAME';
        matchedNameOnly++;
      }
    }

    if (targetProcess) {
      plannedUpdates.push({
        controlId: ctrl.id,
        controlCode: ctrl.code,
        controlName: ctrl.name,
        subProcess: ctrl.subProcess || '-',
        targetProcessId: targetProcess.id,
        targetProcessName: targetProcess.name,
        matchType,
      });
    } else {
      unmatchedCount++;
      unmatchedList.push({
        id: ctrl.id,
        code: ctrl.code,
        name: ctrl.name,
        subProcess: ctrl.subProcess,
        businessProcess: ctrl.businessProcess,
        fsliCodes: ctrl.fsliCodes,
        organizationId: ctrl.organizationId,
      });
    }
  }

  // Summary Metrics
  console.log("--------------------------------------------------------------------------------");
  console.log(`✅ Matched (High Precision - SubProcess & GL): ${matchedExact}`);
  console.log(`✅ Matched (Diagram Node Relation):           ${matchedDiagram}`);
  console.log(`✅ Matched (Unique SubProcess Name):          ${matchedNameOnly}`);
  console.log(`⚠️ Unmatched controls:                         ${unmatchedCount}`);
  console.log("--------------------------------------------------------------------------------\n");

  if (plannedUpdates.length > 0) {
    console.log(`Sample Planned Linkages (first 5 of ${plannedUpdates.length}):`);
    plannedUpdates.slice(0, 5).forEach((p, i) => {
      console.log(`  [${i + 1}] Control ${p.controlCode} ("${p.controlName}")`);
      console.log(`      SubProcess: "${p.subProcess}" -> Linked to BPM Process: "${p.targetProcessName}" (${p.targetProcessId})`);
      console.log(`      Reason: ${p.matchType}\n`);
    });
  }

  if (isApply) {
    console.log(`⚡ Executing updates on ${plannedUpdates.length} controls...`);
    let updatedCount = 0;
    for (const update of plannedUpdates) {
      await db.update(schema.controls)
        .set({ bpmProcessId: update.targetProcessId })
        .where(eq(schema.controls.id, update.controlId));
      updatedCount++;
    }
    console.log(`\n🎉 Successfully backfilled ${updatedCount} controls with bpmProcessId!`);
  } else {
    console.log(`ℹ️  DRY RUN COMPLETED. No database mutations were made.`);
    console.log(`👉 To apply these changes, run with: npm run db:backfill-bpm -- --apply`);
  }

  // Save unmatched controls to JSON if any
  if (unmatchedList.length > 0) {
    const reportPath = path.resolve(process.cwd(), 'unmatched_controls.json');
    fs.writeFileSync(reportPath, JSON.stringify(unmatchedList, null, 2), 'utf-8');
    console.log(`\n⚠️  ${unmatchedList.length} unmatched controls written to ${reportPath} for review.`);
  }

  console.log("\n================================================================================");
  process.exit(0);
}

main().catch(err => {
  console.error("❌ Fatal error in backfill script:", err);
  process.exit(1);
});
