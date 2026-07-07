import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { accountAssertions } from './schema';
import { isNull } from 'drizzle-orm';

const databaseUrl = (process.env as any).DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(databaseUrl);
const db = drizzle(sql);

async function backfill() {
  console.log("Backfilling existing account_assertions to year 2025...");

  try {
    const result = await db.update(accountAssertions)
      .set({ year: 2025 })
      .where(isNull(accountAssertions.year));
    console.log("Backfill completed successfully.");
  } catch (error) {
    console.error("Backfill failed:", error);
  }
}

backfill();
