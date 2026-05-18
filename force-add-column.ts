import { getDb } from './worker/db';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';

async function force() {
  const devVars = readFileSync('.dev.vars', 'utf-8');
  let url = '';
  devVars.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key.trim() === 'DATABASE_URL') url = vals.join('=').trim();
  });

  const db = getDb(url);
  console.log('🚀 Force adding "source" column to "deficiencies"...');
  
  try {
    await db.execute(sql`
      ALTER TABLE deficiencies 
      ADD COLUMN IF NOT EXISTS source text DEFAULT 'Lini 1 - CSA'
    `);
    console.log('✅ Column added (or already existed).');
  } catch (err) {
    console.error('❌ Failed to add column:', err);
  }
  
  process.exit(0);
}

force().catch(console.error);
