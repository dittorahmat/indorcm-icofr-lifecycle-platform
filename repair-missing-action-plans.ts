import { getDb } from './worker/db';
import { csaRecords, deficiencies, actionPlans } from './worker/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load .dev.vars (Cloudflare format) or .env
try {
  const devVars = readFileSync('.dev.vars', 'utf-8');
  devVars.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length > 0) process.env[key.trim()] = vals.join('=').trim();
  });
} catch (e) {
  dotenv.config();
}

const db = getDb(process.env.DATABASE_URL!);

async function repair() {
  console.log('🔍 Searching for Ineffective CSA records without Action Plans...');

  // 1. Get all Ineffective CSA records
  const ineffCsa = await db.select().from(csaRecords).where(eq(csaRecords.result, 'Ineffective'));
  
  console.log(`📊 Found ${ineffCsa.length} total Ineffective CSA records.`);

  let repairedCount = 0;

  for (const csa of ineffCsa) {
    // 2. Check if a deficiency exists for this control and period
    const existingDef = await db.select().from(deficiencies).where(and(
      eq(deficiencies.controlId, csa.controlId),
      eq(deficiencies.organizationId, csa.organizationId),
      sql`description LIKE ${`%%%${csa.period}%`}`
    )).limit(1);

    let defId: string;

    if (existingDef.length === 0) {
      // Create missing deficiency
      defId = crypto.randomUUID();
      console.log(`➕ Creating Deficiency for Control: ${csa.controlId} (${csa.period})`);
      await db.insert(deficiencies).values({
        id: defId,
        organizationId: csa.organizationId,
        controlId: csa.controlId,
        description: `[REPAIR] CSA result for ${csa.period} is Ineffective. Comments: ${csa.comments || 'No comments provided.'}`,
        severity: 'Control Deficiency',
        identifiedDate: csa.assessmentDate ? new Date(csa.assessmentDate) : new Date(),
        identifiedBy: csa.assessedBy || 'SYSTEM-REPAIR',
        status: 'Open'
      });
    } else {
      defId = existingDef[0].id;
      console.log(`ℹ️ Deficiency already exists for Control: ${csa.controlId} (${csa.period})`);
    }

    // 3. Check if Action Plan exists for this deficiency
    const existingPlan = await db.select().from(actionPlans).where(eq(actionPlans.deficiencyId, defId)).limit(1);

    if (existingPlan.length === 0) {
      console.log(`🚀 Creating Action Plan for Deficiency: ${defId}`);
      await db.insert(actionPlans).values({
        id: crypto.randomUUID(),
        organizationId: csa.organizationId,
        deficiencyId: defId,
        description: `Remediasi temuan CSA ${csa.period} (Backfilled)`,
        status: 'Draft',
        workflowStatus: 'Ineffective',
        ownerId: csa.assessedBy || 'SYSTEM-REPAIR',
        createdAt: new Date(),
      } as any);
      repairedCount++;
    }
  }

  console.log(`✅ Repair complete! ${repairedCount} records were fixed and should now appear on the board.`);
  process.exit(0);
}

repair().catch(err => {
  console.error('❌ Repair failed:', err);
  process.exit(1);
});
