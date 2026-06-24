import { getDb } from './worker/db';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';

async function check() {
  const devVars = readFileSync('.dev.vars', 'utf-8');
  let url = '';
  devVars.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key.trim() === 'DATABASE_URL') url = vals.join('=').trim();
  });

  // Try direct connection
  const directUrl = url.replace('-pooler', '');
  console.log('📡 Checking columns via DIRECT connection...');
  
  const db = getDb(directUrl);
  
  const result = await db.execute(sql`
    SELECT table_schema, column_name 
    FROM information_schema.columns 
    WHERE table_name = 'deficiencies'
  `);
  
  const rows = Array.isArray(result) ? result : (result as any).rows || [];
  console.log('📊 Existing columns:', rows.map((r: any) => `${r.table_schema}.${r.column_name}`).join(', '));
  process.exit(0);
}

check().catch(console.error);
