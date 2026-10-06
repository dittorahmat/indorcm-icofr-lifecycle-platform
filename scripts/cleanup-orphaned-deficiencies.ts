import { getDb } from '../worker/db';
import { deficiencies, actionPlans } from '../worker/db/schema';
import { isNull, and, inArray } from 'drizzle-orm';

async function cleanup() {
  const db = getDb(process.env.DATABASE_URL);
  console.log('🧹 Starting cleanup of orphaned deficiencies (no controlId)...');

  // 1. Find all deficiencies where controlId is null
  const orphaned = await db.select({ id: deficiencies.id })
    .from(deficiencies)
    .where(isNull(deficiencies.controlId));

  const orphanedIds = orphaned.map(d => d.id);

  if (orphanedIds.length === 0) {
    console.log('✅ No orphaned deficiencies found.');
    return;
  }

  console.log(`🗑 Found ${orphanedIds.length} orphaned deficiencies. Deleting associated action plans and deficiencies...`);

  // 2. Delete associated action plans first (foreign key constraint)
  const apDelete = await db.delete(actionPlans).where(inArray(actionPlans.deficiencyId, orphanedIds));
  console.log(`   - Deleted associated action plans.`);

  // 3. Delete the deficiencies
  const dDelete = await db.delete(deficiencies).where(inArray(deficiencies.id, orphanedIds));
  console.log(`   - Deleted ${orphanedIds.length} deficiencies.`);

  console.log('✨ Cleanup complete. Your Dashboard and Board are now clean.');
}

cleanup().catch(console.error);
