import { getDb } from '../worker/db';
import { deficiencies, actionPlans } from '../worker/db/schema';
import { eq, notInArray, sql } from 'drizzle-orm';

async function repair() {
  const db = getDb(process.env.DATABASE_URL);
  console.log('🔍 Checking for deficiencies without action plans...');

  // 1. Get all deficiencies
  const allDeficiencies = await db.select().from(deficiencies);
  
  // 2. Get all action plans to identify which deficiencies are covered
  const allActionPlans = await db.select().from(actionPlans);
  const coveredDeficiencyIds = new Set(allActionPlans.map(ap => ap.deficiencyId));

  const orphanedDeficiencies = allDeficiencies.filter(d => !coveredDeficiencyIds.has(d.id));

  if (orphanedDeficiencies.length === 0) {
    console.log('✅ No orphaned deficiencies found.');
    return;
  }

  console.log(`🛠 Found ${orphanedDeficiencies.length} orphaned deficiencies. Creating action plans...`);

  const plansToInsert = orphanedDeficiencies.map(def => ({
    id: crypto.randomUUID(),
    organizationId: def.organizationId,
    deficiencyId: def.id,
    description: `[BACKFILL] Rencana tindak lanjut atas temuan: ${def.description.substring(0, 50)}...`,
    status: 'Draft',
    workflowStatus: 'Ineffective',
    ownerId: def.identifiedBy,
    createdAt: new Date(),
  }));

  for (const plan of plansToInsert) {
    await db.insert(actionPlans).values(plan as any);
    console.log(`   + Created Action Plan ${plan.id} for Deficiency ${plan.deficiencyId}`);
  }

  console.log('✨ Repair complete. Dashboard and Board should now be in sync.');
}

repair().catch(console.error);
