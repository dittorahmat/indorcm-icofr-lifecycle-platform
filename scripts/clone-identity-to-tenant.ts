import 'dotenv/config';
import postgres from 'postgres';
import {
  IDENTITY_TABLES,
  IDENTITY_TABLE_NAMES,
  isSameDatabase,
  selectContentTables,
  toDirectUrl,
  evaluateClone,
  type CloneVerification,
} from './lib/clone-identity';

/**
 * Clone the identity layer (organizations, entities, departments, users,
 * credentials, memberships, preferences) from the primary instance database to
 * an isolated instance database.
 *
 * Deliberately NOT copied: sessions, verification tokens, notifications, audit
 * logs, and every ICOFR content table. A new instance starts with the same
 * people and zero content.
 *
 * Password hashes are copied verbatim; `worker/auth.ts` verifies the
 * `pbkdf2$<iterations>$<salt>$<hash>` format, so credentials keep working
 * without a reset. The verification step reads BOTH databases and fails closed
 * when there is nothing to compare.
 *
 * This is an out-of-band provisioning script, not a runtime mutation: it is run
 * once by an operator against a fresh database, so it writes no `audit_logs`
 * or `ChangeLog` row. Application-level auditability starts after go-live.
 *
 * Usage:
 *   TARGET_DATABASE_URL=... npx tsx scripts/clone-identity-to-tenant.ts            # dry run
 *   TARGET_DATABASE_URL=... npx tsx scripts/clone-identity-to-tenant.ts --apply    # write
 *
 * Source resolution: SOURCE_DATABASE_URL, else DATABASE_URL.
 */

const apply = process.argv.includes('--apply');
const sourceUrl = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
const targetUrl = process.env.TARGET_DATABASE_URL;

if (!sourceUrl || !targetUrl) {
  console.error('❌ SOURCE_DATABASE_URL (or DATABASE_URL) and TARGET_DATABASE_URL are required.');
  process.exitCode = 1;
} else if (apply && isSameDatabase(sourceUrl, targetUrl)) {
  console.error(
    '❌ Refusing to --apply: source and target resolve to the same database.\n' +
      '   Drop --apply to run the read-only parity check against one database.',
  );
  process.exitCode = 1;
} else {
  run(sourceUrl, targetUrl).catch((error) => {
    console.error('❌ Identity clone failed:', error);
    process.exitCode = 1;
  });
}

async function countRows(sql: postgres.Sql, table: string): Promise<number> {
  const [row] = await sql<{ count: string }[]>`SELECT count(*)::text AS count FROM ${sql(table)}`;
  return Number(row?.count ?? 0);
}

async function countAll(sql: postgres.Sql, tables: string[]): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const table of tables) {
    counts[table] = await countRows(sql, table);
  }
  return counts;
}

/** Every application table in the target schema, so new tables are covered. */
async function listContentTables(sql: postgres.Sql): Promise<string[]> {
  const rows = await sql<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'icofr' ORDER BY tablename
  `;
  return selectContentTables(rows.map((row) => row.tablename));
}

/**
 * Distinguishes "same email, new id" from a normal idempotent re-run: the
 * upsert keys on `id`, so an email owned by another id would create a duplicate
 * login. Fail before writing instead.
 */
async function assertNoEmailCollisions(source: postgres.Sql, target: postgres.Sql): Promise<void> {
  const sourceUsers = await source<{ id: string; email: string | null }[]>`
    SELECT id, email FROM "user"
  `;
  const targetUsers = await target<{ id: string; email: string | null }[]>`
    SELECT id, email FROM "user"
  `;

  const idByEmail = new Map<string, string>();
  for (const row of targetUsers) {
    if (row.email) idByEmail.set(row.email, row.id);
  }

  const collisions: string[] = [];
  for (const row of sourceUsers) {
    if (!row.email) continue;
    const existingId = idByEmail.get(row.email);
    if (existingId && existingId !== row.id) collisions.push(row.email);
  }

  if (collisions.length > 0) {
    throw new Error(
      `email(s) already belong to a different user id on the target: ${collisions.join(', ')}. ` +
        'Resolve the conflict manually before cloning.',
    );
  }
}

/**
 * Compares credential hashes across both databases. Returns counts so the pure
 * `evaluateClone` can fail closed when the target has no comparable rows.
 */
async function compareCredentialHashes(source: postgres.Sql, target: postgres.Sql) {
  const sourceAccounts = await source<{ id: string; password: string | null }[]>`
    SELECT id, password FROM "account" WHERE "providerId" = 'credential'
  `;
  const targetAccounts = await target<{ id: string; password: string | null }[]>`
    SELECT id, password FROM "account" WHERE "providerId" = 'credential'
  `;

  const targetById = new Map<string, string | null>();
  for (const row of targetAccounts) targetById.set(row.id, row.password);

  let comparableHashes = 0;
  let hashMismatches = 0;
  for (const row of sourceAccounts) {
    if (!targetById.has(row.id)) continue;
    const targetHash = targetById.get(row.id) ?? null;
    if (typeof row.password !== 'string' || typeof targetHash !== 'string') continue;
    comparableHashes++;
    if (row.password !== targetHash) hashMismatches++;
  }

  return { credentialRows: sourceAccounts.length, comparableHashes, hashMismatches };
}

async function run(sourceUrl: string, targetUrl: string): Promise<void> {
  if (isSameDatabase(sourceUrl, targetUrl)) {
    console.log('ℹ️  Source and target are the same database — read-only parity check.');
  }

  // Neon's pooler does not preserve session-level settings across transactions,
  // and `search_path` must be pinned for the whole run.
  const source = postgres(toDirectUrl(sourceUrl), { max: 1, connect_timeout: 30, idle_timeout: 5 });
  const target = postgres(toDirectUrl(targetUrl), { max: 1, connect_timeout: 30, idle_timeout: 5 });

  // Application tables live in the `icofr` schema (worker/db/schema/types.ts).
  await source.unsafe('SET search_path TO icofr, public');
  await target.unsafe('SET search_path TO icofr, public');

  try {
    console.log(`🔎 Reading identity tables from the source (${apply ? 'APPLY' : 'DRY RUN'})...`);
    const sourceCounts = await countAll(source, IDENTITY_TABLE_NAMES);
    const targetCountsBefore = await countAll(target, IDENTITY_TABLE_NAMES);

    console.log('\n  table                 source   target(before)');
    for (const table of IDENTITY_TABLE_NAMES) {
      console.log(
        `  ${table.padEnd(20)}  ${String(sourceCounts[table]).padStart(6)}   ${String(targetCountsBefore[table]).padStart(14)}`,
      );
    }

    if (!apply) {
      console.log('\n🟡 Dry run — nothing written. Re-run with --apply to copy.');
      return;
    }

    await assertNoEmailCollisions(source, target);

    await target.begin(async (tx) => {
      for (const spec of IDENTITY_TABLES) {
        const rows = await source<Record<string, unknown>[]>`SELECT * FROM ${source(spec.table)}`;
        if (rows.length === 0) {
          console.log(`⏭️  ${spec.table}: source is empty.`);
          continue;
        }

        const columns = Object.keys(rows[0]);
        const selfFkColumn = spec.selfFkColumn;
        const payload = selfFkColumn ? rows.map((row) => ({ ...row, [selfFkColumn]: null })) : rows;
        const updates = columns
          .filter((column) => column !== spec.pk)
          .map((column) => tx`${tx(column)} = excluded.${tx(column)}`);

        const conflict = updates.length
          ? tx`ON CONFLICT (${tx(spec.pk)}) DO UPDATE SET ${updates.reduce((left, right) => tx`${left}, ${right}`)}`
          : tx`ON CONFLICT (${tx(spec.pk)}) DO NOTHING`;

        await tx`
          INSERT INTO ${tx(spec.table)} ${tx(payload, ...columns)}
          ${conflict}
        `;

        if (selfFkColumn) {
          const childRows = rows.filter((row) => row[selfFkColumn] !== null && row[selfFkColumn] !== undefined);
          for (const row of childRows) {
            await tx`
              UPDATE ${tx(spec.table)}
              SET ${tx(selfFkColumn)} = ${String(row[selfFkColumn])}
              WHERE ${tx(spec.pk)} = ${String(row[spec.pk])}
            `;
          }
        }

        console.log(`✅ ${spec.table}: ${rows.length} row(s) upserted.`);
      }
    });

    const targetCountsAfter = await countAll(target, IDENTITY_TABLE_NAMES);
    const hashes = await compareCredentialHashes(source, target);
    const contentTables = await listContentTables(target);
    const contentCounts = await countAll(target, contentTables);

    console.log('\n  table                 source   target(after)   diff');
    for (const table of IDENTITY_TABLE_NAMES) {
      const diff = (targetCountsAfter[table] ?? 0) - (sourceCounts[table] ?? 0);
      console.log(
        `  ${table.padEnd(20)}  ${String(sourceCounts[table]).padStart(6)}   ${String(targetCountsAfter[table]).padStart(13)}   ${String(diff).padStart(5)}`,
      );
    }

    console.log(
      `\n🔐 Credential hashes: ${hashes.comparableHashes} compared across both databases, ${hashes.hashMismatches} mismatch(es).`,
    );

    console.log(`\n  content table          target count (must be 0) — ${contentTables.length} table(s) checked`);
    for (const table of contentTables) {
      console.log(`  ${table.padEnd(20)}  ${String(contentCounts[table]).padStart(6)}`);
    }

    const verification: CloneVerification = {
      sourceCounts,
      targetCounts: targetCountsAfter,
      contentCounts,
      ...hashes,
    };
    const verdict = evaluateClone(verification);

    if (!verdict.ok) {
      console.error(`\n❌ Verification failed:\n - ${verdict.failures.join('\n - ')}`);
      process.exitCode = 1;
      return;
    }

    console.log('\n✨ Identity clone complete — identity tables match, credentials match, content stays empty.');
  } finally {
    await source.end({ timeout: 5 });
    await target.end({ timeout: 5 });
  }
}
