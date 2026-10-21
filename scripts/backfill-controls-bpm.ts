import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import { eq, inArray, sql } from 'drizzle-orm';
import { createDbAndPool } from '../worker/db';
import * as schema from '../worker/db/schema';
import { requireEnv } from './lib/require-env';

// Load .env
config({ path: path.resolve(process.cwd(), '.env') });
const dbUrl = requireEnv('DATABASE_URL');

const isDryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');
const isApply = process.argv.includes('--apply');
const isCleanupOrphans = process.argv.includes('--cleanup-orphans');

// Normalizer for fuzzy matching (removes accents, punctuation, standardizes prefixes/suffixes)
function normalizeName(str: string): string {
  return (str || '')
    .toLowerCase()
    .trim()
    .replace(/\bsetor\b/g, 'setoran') // normalizes 'setor' -> 'setoran'
    .replace(/[^a-z0-9]/g, '');
}

async function main() {
  console.log("================================================================================");
  console.log(" 🛠️  BPM CONTROLS BACKFILL & ORPHAN RESOLUTION SCRIPT");
  console.log("================================================================================");
  console.log(`📡 Mode: ${isApply ? '🚀 APPLY MUTATIONS' : '🔍 DRY RUN (Simulasi, tidak mengubah data)'}`);
  console.log(`🧹 Cleanup Orphans: ${isCleanupOrphans ? '✅ AKTIF (Akan menghapus orphan tanpa relasi)' : '❌ NON-AKTIF (Gunakan --cleanup-orphans jika ingin menghapus)'}`);
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

  // 2. Fetch all metadata for mapping and dependency checks
  const allBpmProcesses = await db.select().from(schema.bpmProcesses);
  const allDiagrams = await db.select().from(schema.bpmDiagrams);
  const allRcmControls = await db.select().from(schema.rcmControls);
  const allNodeRcms = await db.select().from(schema.bpmNodeRcms);
  const allCsaRecords = await db.select().from(schema.csaRecords);
  const allTestRecords = await db.select().from(schema.testRecords);
  const allDeficiencies = await db.select().from(schema.deficiencies);

  console.log(`📚 Indexed:`);
  console.log(`   - ${allBpmProcesses.length} BPM Processes`);
  console.log(`   - ${allDiagrams.length} BPM Diagrams`);
  console.log(`   - ${allRcmControls.length} RCM-Control mappings`);
  console.log(`   - ${allNodeRcms.length} Diagram Node-RCM links\n`);

  let matchedExact = 0;
  let matchedDiagram = 0;
  let matchedDiagramNode = 0;
  let matchedNameFuzzy = 0;
  let matchedUniqueName = 0;
  let matchedGlFallback = 0;

  const plannedUpdates: Array<{
    controlId: string;
    controlCode: string;
    controlName: string;
    subProcess: string;
    targetProcessId: string;
    targetProcessName: string;
    matchType: string;
  }> = [];

  const orphanCandidates: Array<{
    id: string;
    code: string;
    name: string;
    subProcess: string | null;
    fsliCodes: any;
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
    const ctrlSub = (ctrl.subProcess || '').trim();
    const ctrlNormSub = normalizeName(ctrlSub);
    const ctrlFsliCodes = Array.isArray(ctrl.fsliCodes) ? ctrl.fsliCodes : [];

    let targetProcess: typeof allBpmProcesses[0] | undefined;
    let matchType = '';

    // =========================================================================
    // Strategy 1: Exact SubProcess Name AND GL Match
    // =========================================================================
    if (ctrlSub) {
      targetProcess = allBpmProcesses.find(p => {
        if (p.organizationId !== ctrl.organizationId) return false;
        const pName = (p.name || '').trim().toLowerCase();
        if (pName !== ctrlSub.toLowerCase()) return false;
        return p.noGL && ctrlFsliCodes.includes(p.noGL);
      });

      if (targetProcess) {
        matchType = 'EXACT_SUBPROCESS_AND_GL';
        matchedExact++;
      }
    }

    // =========================================================================
    // Strategy 2: Normalized/Fuzzy SubProcess Name AND GL Match (e.g. setor vs setoran)
    // =========================================================================
    if (!targetProcess && ctrlNormSub) {
      targetProcess = allBpmProcesses.find(p => {
        if (p.organizationId !== ctrl.organizationId) return false;
        const pNorm = normalizeName(p.name || '');
        if (pNorm !== ctrlNormSub) return false;
        return p.noGL && ctrlFsliCodes.includes(p.noGL);
      });

      if (targetProcess) {
        matchType = 'NORMALIZED_SUBPROCESS_AND_GL';
        matchedNameFuzzy++;
      }
    }

    // =========================================================================
    // Strategy 3: Trace via RCM -> Diagram Linkage (Node-RCM)
    // =========================================================================
    let linkedDiagram: typeof allDiagrams[0] | undefined;
    if (!targetProcess) {
      const rcmCtrl = allRcmControls.find(rc => rc.controlId === ctrl.id);
      if (rcmCtrl) {
        const nodeLink = allNodeRcms.find(nr => nr.rcmId === rcmCtrl.rcmId);
        if (nodeLink) {
          linkedDiagram = allDiagrams.find(d => d.id === nodeLink.diagramId);
        }
      }
    }

    // =========================================================================
    // Strategy 4: Direct Diagram Node / Badge Search (e.g. C-1777874633490)
    // =========================================================================
    if (!targetProcess && !linkedDiagram) {
      linkedDiagram = allDiagrams.find(d => {
        const raw = JSON.stringify(d.nodes || []);
        return raw.includes(ctrl.id) || (ctrl.code && raw.includes(ctrl.code));
      });
      if (linkedDiagram) {
        matchType = 'DIRECT_DIAGRAM_NODE_MATCH';
      }
    }

    // If diagram was found, resolve to best matching BPM Process
    if (!targetProcess && linkedDiagram) {
      const diagSubNorm = normalizeName(linkedDiagram.subProcess || linkedDiagram.name || '');
      
      // 4a. Find process with exact/normalized name match to diagram
      targetProcess = allBpmProcesses.find(p => 
        p.organizationId === ctrl.organizationId &&
        (normalizeName(p.name || '') === diagSubNorm ||
         (linkedDiagram?.subProcess && p.name?.trim().toLowerCase() === linkedDiagram.subProcess.trim().toLowerCase()) ||
         (linkedDiagram?.name && p.name?.trim().toLowerCase() === linkedDiagram.name.trim().toLowerCase()))
      );

      if (targetProcess) {
        matchType = matchType || 'BPM_DIAGRAM_RELATION';
        if (matchType === 'DIRECT_DIAGRAM_NODE_MATCH') {
          matchedDiagramNode++;
        } else {
          matchedDiagram++;
        }
      } else {
        // 4b. Diagram exists with RCM link, but BPM Process has different name on same GL
        // Match against BPM processes with same GL
        const sameGlProcesses = allBpmProcesses.filter(p => 
          p.organizationId === ctrl.organizationId &&
          p.noGL && ctrlFsliCodes.includes(p.noGL)
        );

        if (sameGlProcesses.length > 0) {
          // Rank matches by word overlap with diagram name or subprocess
          const searchTokens = `${ctrlSub} ${linkedDiagram.name} ${linkedDiagram.subProcess}`.toLowerCase().split(/\s+/).filter(Boolean);
          const scored = sameGlProcesses.map(proc => {
            const procLower = proc.name.toLowerCase();
            const score = searchTokens.filter(t => procLower.includes(t)).length;
            return { proc, score };
          }).sort((a, b) => b.score - a.score);

          targetProcess = scored[0].proc;
          matchType = 'DIAGRAM_GL_FALLBACK';
          matchedGlFallback++;
        }
      }
    }

    // =========================================================================
    // Strategy 5: SubProcess Unique Name Match within same Org
    // =========================================================================
    if (!targetProcess && ctrlSub) {
      const candidates = allBpmProcesses.filter(p => 
        p.organizationId === ctrl.organizationId &&
        (p.name || '').trim().toLowerCase() === ctrlSub.toLowerCase()
      );

      if (candidates.length === 1) {
        targetProcess = candidates[0];
        matchType = 'UNIQUE_SUBPROCESS_NAME';
        matchedUniqueName++;
      }
    }

    // =========================================================================
    // Strategy 6: GL Account Fallback (if Control has valid GL and only 1 logical process)
    // =========================================================================
    if (!targetProcess && ctrlFsliCodes.length > 0) {
      const glCandidates = allBpmProcesses.filter(p => 
        p.organizationId === ctrl.organizationId &&
        p.noGL && ctrlFsliCodes.includes(p.noGL)
      );

      if (glCandidates.length === 1) {
        targetProcess = glCandidates[0];
        matchType = 'UNIQUE_GL_PROCESS_MATCH';
        matchedGlFallback++;
      }
    }

    // =========================================================================
    // Evaluation: Matched vs Orphan vs Unmatched
    // =========================================================================
    if (targetProcess) {
      plannedUpdates.push({
        controlId: ctrl.id,
        controlCode: ctrl.code,
        controlName: ctrl.name,
        subProcess: ctrl.subProcess || linkedDiagram?.name || '-',
        targetProcessId: targetProcess.id,
        targetProcessName: targetProcess.name,
        matchType,
      });
    } else {
      // Check if control is truly orphaned (no RCM, no Diagram, no CSA, no Testing, no Deficiencies)
      const hasRcm = allRcmControls.some(rc => rc.controlId === ctrl.id);
      const inDiagram = allDiagrams.some(d => JSON.stringify(d.nodes || []).includes(ctrl.id));
      const hasCsa = allCsaRecords.some((r: any) => r.controlId === ctrl.id);
      const hasTest = allTestRecords.some((r: any) => r.controlId === ctrl.id);
      const hasDef = allDeficiencies.some((r: any) => r.controlId === ctrl.id);

      if (!hasRcm && !inDiagram && !hasCsa && !hasTest && !hasDef) {
        orphanCandidates.push({
          id: ctrl.id,
          code: ctrl.code,
          name: ctrl.name,
          subProcess: ctrl.subProcess,
          fsliCodes: ctrl.fsliCodes,
        });
      } else {
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
  }

  // Summary Metrics
  console.log("--------------------------------------------------------------------------------");
  console.log("📊 RESOLUTION BREAKDOWN:");
  console.log(`✅ Matched (Exact SubProcess & GL):            ${matchedExact}`);
  console.log(`✅ Matched (Normalized/Fuzzy Name & GL):       ${matchedNameFuzzy}`);
  console.log(`✅ Matched (Diagram Name Relation):            ${matchedDiagram}`);
  console.log(`✅ Matched (Diagram Node/Badge Relation):      ${matchedDiagramNode}`);
  console.log(`✅ Matched (Diagram GL Fallback Resolution):   ${matchedGlFallback}`);
  console.log(`✅ Matched (Unique SubProcess Name):           ${matchedUniqueName}`);
  console.log(`--------------------------------------------------------------------------------`);
  console.log(`🎯 TOTAL CONTROLS TO LINK:                    ${plannedUpdates.length}`);
  console.log(`🗑️  ORPHAN CONTROLS IDENTIFIED:                ${orphanCandidates.length}`);
  console.log(`⚠️  REMAINING UNMATCHED CONTROLS:              ${unmatchedList.length}`);
  console.log("--------------------------------------------------------------------------------\n");

  // Print Planned Updates
  if (plannedUpdates.length > 0) {
    console.log(`📋 Planned Linkages (${plannedUpdates.length} controls):`);
    plannedUpdates.forEach((p, i) => {
      console.log(`  [${i + 1}] Control ${p.controlCode} ("${p.controlName}")`);
      console.log(`      SubProcess: "${p.subProcess}" -> Linked to BPM Process: "${p.targetProcessName}" (${p.targetProcessId})`);
      console.log(`      Match Reason: ${p.matchType}\n`);
    });
  }

  // Print Orphan Candidates
  if (orphanCandidates.length > 0) {
    console.log(`🗑️  Orphan Candidates identified (${orphanCandidates.length} controls):`);
    orphanCandidates.forEach((o, i) => {
      console.log(`  [${i + 1}] Code: ${o.code} | Name: "${o.name}" | SubProcess: "${o.subProcess}" | GL: ${JSON.stringify(o.fsliCodes)}`);
    });
    console.log("");
  }

  // Handle Orphan Cleanup if requested
  if (orphanCandidates.length > 0 && isCleanupOrphans && isApply) {
    const orphanIds = orphanCandidates.map(o => o.id);
    console.log(`🧹 Deleting ${orphanIds.length} orphan controls from database...`);
    await db.delete(schema.controls).where(inArray(schema.controls.id, orphanIds));
    console.log(`✅ Successfully deleted ${orphanIds.length} orphan controls!\n`);
  } else if (orphanCandidates.length > 0 && isCleanupOrphans && !isApply) {
    console.log(`ℹ️  [DRY RUN] Would delete ${orphanCandidates.length} orphan controls. (Omit --dry-run and use --apply --cleanup-orphans to execute)`);
  }

  // Execute Backfill Updates
  if (isApply && plannedUpdates.length > 0) {
    console.log(`⚡ Executing updates on ${plannedUpdates.length} controls...`);
    let updatedCount = 0;
    for (const update of plannedUpdates) {
      await db.update(schema.controls)
        .set({ bpmProcessId: update.targetProcessId })
        .where(eq(schema.controls.id, update.controlId));
      updatedCount++;
    }
    console.log(`\n🎉 Successfully backfilled ${updatedCount} controls with bpmProcessId!`);
  } else if (!isApply) {
    console.log(`ℹ️  DRY RUN COMPLETED. No database mutations were made.`);
    console.log(`👉 To apply updates & cleanup orphans, run:`);
    console.log(`   npx tsx scripts/backfill-controls-bpm.ts --apply --cleanup-orphans\n`);
  }

  // Save unmatched controls to JSON if any remain
  const reportPath = path.resolve(process.cwd(), 'unmatched_controls.json');
  if (unmatchedList.length > 0 || orphanCandidates.length > 0) {
    fs.writeFileSync(reportPath, JSON.stringify({ unmatched: unmatchedList, orphans: orphanCandidates }, null, 2), 'utf-8');
    console.log(`⚠️  Review data written to ${reportPath}.`);
  } else {
    // If none left, write empty
    fs.writeFileSync(reportPath, JSON.stringify([], null, 2), 'utf-8');
  }

  console.log("\n================================================================================");
  process.exit(0);
}

main().catch(err => {
  console.error("❌ Fatal error in backfill script:", err);
  process.exit(1);
});
