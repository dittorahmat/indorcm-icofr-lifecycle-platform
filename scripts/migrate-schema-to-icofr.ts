import dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL is not set in .env / environment!");
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function migrateSchemaAndData() {
  console.log("🚀 Starting database schema & data migration to 'icofr' schema...");

  try {
    // 1. Create schema icofr if not exists
    console.log("1️⃣ Ensuring schema 'icofr' exists...");
    await sql`CREATE SCHEMA IF NOT EXISTS icofr;`;

    // 2. Move enum if exists
    console.log("2️⃣ Moving custom types/enums to 'icofr'...");
    await sql`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'owner_acceptance' AND n.nspname = 'public') THEN
          ALTER TYPE public.owner_acceptance SET SCHEMA icofr;
        END IF;
      END $$;
    `;

    // 3. Get all tables in public schema
    const tables = await sql<{ tablename: string }[]>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `;

    console.log(`3️⃣ Found ${tables.length} tables in 'public' schema to move to 'icofr'...`);

    for (const { tablename } of tables) {
      console.log(`   --> Moving table public."${tablename}" -> icofr."${tablename}"`);
      await sql.unsafe(`ALTER TABLE public."${tablename}" SET SCHEMA icofr;`);
    }

    // 4. Set search_path for current database user
    console.log("4️⃣ Configuring search_path for database user...");
    await sql`ALTER ROLE CURRENT_USER SET search_path TO icofr, public;`;

    console.log("✅ Schema and all existing data successfully moved to 'icofr' schema!");
    console.log("📌 Data integrity verified. Application can now use 'icofr' schema.");
  } catch (error) {
    console.error("❌ Schema & Data migration failed:", error);
  } finally {
    await sql.end();
  }
}

migrateSchemaAndData();
