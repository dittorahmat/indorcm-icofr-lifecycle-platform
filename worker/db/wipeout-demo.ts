import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

// Load environment variables (.env file)
dotenv.config();

// Explicit list of tables to truncate (Strictly preserves auth, rbac, departments, licenses, and AI knowledge)
export const TABLES_TO_TRUNCATE = [
  // Deficiencies & Remediation Action Plans
  'aggregate_deficiencies',
  'action_plans',
  'deficiencies',

  // Testing & Control Assessments (CSA / TOD / TOE)
  'test_samples',
  'test_records',
  'tod_evaluations',
  'csa_samples',
  'csa_records',
  'csa_schedules',

  // RCM & Business Process Mapping (BPM)
  'bpm_node_rcms',
  'bpm_exports',
  'bpm_diagrams',
  'bpm_process_gl_codes',
  'bpm_processes',
  'rcm_controls',
  'controls',
  'rcms',

  // Scoping, Materiality & General Ledger
  'simulation_account_applications',
  'simulations',
  'materiality',
  'transaction_uploads',
  'transaction_details',
  'gl_rows',
  'gl_snapshots',

  // IT Applications, Vendor SOC, WBS, & Audit Logs
  'application_documents',
  'applications',
  'soc_evaluations',
  'soc_reports',
  'vendors',
  'wbs_reports',
  'migration_sessions',
  'audit_logs',
  'notifications',
];

export const PRESERVED_TABLES = [
  'user',
  'account',
  'member',
  'session',
  'verification',
  'organization',
  'business_entities',
  'departments',
  'system_licenses',
  'documents',
  'document_chunks',
  'document_departments',
  'document_gls',
  'document_fslis',
  'user_preferences',
];

async function countRows(sql: any, tableName: string): Promise<number> {
  try {
    const res = await sql(`SELECT count(*)::int as count FROM "${tableName}"`);
    return res[0]?.count ?? 0;
  } catch (err: any) {
    // Return 0 if table does not exist yet
    return 0;
  }
}

export async function runWipeout(dryRun: boolean = false, autoConfirm: boolean = false) {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL is not set in environment or .env file.');
    process.exit(1);
  }

  console.log('\n============================================================');
  console.log('       🛡️  IndoGRC Demo Data Wipeout Utility 🛡️');
  console.log('============================================================');
  console.log(`Target Database: ${databaseUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@')}`);

  const sql = neon(databaseUrl);

  console.log('\n📊 Checking current database records:');
  console.log('--- TABLES TO BE WIPEOUT ---');
  for (const table of TABLES_TO_TRUNCATE) {
    const c = await countRows(sql, table);
    if (c > 0) {
      console.log(`  • ${table.padEnd(35)}: ${c} rows`);
    }
  }

  console.log('\n--- PRESERVED SYSTEM FOUNDATION & AI KNOWLEDGE ---');
  for (const table of PRESERVED_TABLES) {
    const c = await countRows(sql, table);
    console.log(`  ✓ [KEPT] ${table.padEnd(28)}: ${c} rows`);
  }

  if (dryRun) {
    console.log('\n🔍 [DRY-RUN MODE] No data was modified.');
    return;
  }

  if (!autoConfirm) {
    const rl = readline.createInterface({ input, output });
    console.log('\n⚠️  WARNING: This operation will permanently TRUNCATE operational tables.');
    console.log('   User accounts, roles, departments, licenses, and AI Knowledge documents will be KEPT.\n');
    const answer = await rl.question('Are you sure you want to proceed? Type "YES" to confirm: ');
    rl.close();

    if (answer.trim() !== 'YES') {
      console.log('❌ Wipeout cancelled by operator.');
      return;
    }
  }

  console.log('\n🚀 Executing atomic TRUNCATE CASCADE...');
  const tableNamesSql = TABLES_TO_TRUNCATE.map((t) => `"${t}"`).join(', ');

  try {
    await sql(`BEGIN`);
    await sql(`TRUNCATE TABLE ${tableNamesSql} CASCADE`);
    await sql(`COMMIT`);
    console.log('✅ TRUNCATE completed successfully!');
  } catch (error) {
    await sql(`ROLLBACK`);
    console.error('❌ FAILED to truncate tables. Transaction rolled back:', error);
    process.exit(1);
  }

  console.log('\n📋 Verification of Preserved Tables:');
  for (const table of PRESERVED_TABLES) {
    const c = await countRows(sql, table);
    console.log(`  ✓ ${table.padEnd(28)}: ${c} rows (intact)`);
  }

  console.log('\n🎉 Clean-slate demo reset finished! Ready for handover.\n');
}

// Direct CLI invocation
const isMain = process.argv[1]?.endsWith('wipeout-demo.ts');
if (isMain) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const autoConfirm = args.includes('--confirm') || args.includes('-y');

  runWipeout(dryRun, autoConfirm).catch((err) => {
    console.error('Fatal wipeout error:', err);
    process.exit(1);
  });
}
