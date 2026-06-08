import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../worker/db/schema';
import { eq } from 'drizzle-orm';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });
const dbUrl = process.env.DATABASE_URL;
const sqlClient = neon(dbUrl!);
const db = drizzle(sqlClient, { schema });

async function run() {
  const ctrlId = 'C-2b86b650';
  const ctrl = await db.select().from(schema.controls).where(eq(schema.controls.id, ctrlId));
  console.log('Control:', JSON.stringify(ctrl, null, 2));
  
  if (ctrl.length > 0 && ctrl[0].bpmProcessId) {
    const proc = await db.select().from(schema.bpmProcesses).where(eq(schema.bpmProcesses.id, ctrl[0].bpmProcessId));
    console.log('Linked Process:', JSON.stringify(proc, null, 2));
    
    // Check if there's a 2026 version of this process
    const proc2026 = await db.select().from(schema.bpmProcesses)
      .where(eq(schema.bpmProcesses.name, proc[0].name))
      .where(eq(schema.bpmProcesses.year, 2026));
    console.log('Is there a 2026 version of this process?', proc2026.length > 0 ? 'Yes' : 'No');
    if (proc2026.length > 0) {
        console.log('2026 Process ID:', proc2026[0].id);
    }
  }
}
run().catch(console.error);
