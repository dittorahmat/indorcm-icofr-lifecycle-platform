import dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config();

const SOURCE_URL = 'postgres://indorcm:indorcm_secure_pass@43.134.78.247:5432/indorcm_icofr';
const TARGET_URL = process.env.DATABASE_URL;

if (!TARGET_URL) {
  console.error("❌ TARGET_URL (DATABASE_URL in .env) is not set!");
  process.exit(1);
}

const sourceSql = postgres(SOURCE_URL, { connect_timeout: 10, idle_timeout: 10 });
const targetSql = postgres(TARGET_URL, { max: 5 });

async function copyData() {
  console.log("🚀 Starting 2-Pass database copy to Target Neon DB (icofr schema)...");

  try {
    await targetSql`CREATE SCHEMA IF NOT EXISTS icofr;`;

    const sourceTables = await sourceSql<{ table_schema: string; table_name: string }[]>`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema IN ('icofr', 'public') 
        AND table_type = 'BASE TABLE';
    `;

    console.log(`📊 Found ${sourceTables.length} tables in source database.`);

    // Pass 1: Insert all rows with ON CONFLICT DO NOTHING
    console.log("\n--- PASS 1: Initial Insert ---");
    for (const { table_schema, table_name } of sourceTables) {
      const rows = await sourceSql.unsafe(`SELECT * FROM ${table_schema}."${table_name}"`);
      if (rows.length === 0) continue;

      const targetTableExists = await targetSql<{ count: string }[]>`
        SELECT count(*) FROM information_schema.tables 
        WHERE table_schema = 'icofr' AND table_name = ${table_name};
      `;
      if (parseInt(targetTableExists[0].count, 10) === 0) continue;

      let inserted = 0;
      for (const row of rows) {
        try {
          const keys = Object.keys(row);
          const values = keys.map(k => {
            const val = row[k];
            if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
              return JSON.stringify(val);
            }
            return val;
          });

          await targetSql.unsafe(
            `INSERT INTO icofr."${table_name}" (${keys.map(k => `"${k}"`).join(',')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(',')}) ON CONFLICT DO NOTHING;`,
            values
          );
          inserted++;
        } catch (err) {
          // ignore FK errors in Pass 1
        }
      }
      console.log(` Pass 1 [${table_name}]: Inserted ${inserted}/${rows.length} rows`);
    }

    // Pass 2: Retry missing rows now that parent tables are populated
    console.log("\n--- PASS 2: Retry Pending Rows ---");
    for (const { table_schema, table_name } of sourceTables) {
      const rows = await sourceSql.unsafe(`SELECT * FROM ${table_schema}."${table_name}"`);
      if (rows.length === 0) continue;

      const targetTableExists = await targetSql<{ count: string }[]>`
        SELECT count(*) FROM information_schema.tables 
        WHERE table_schema = 'icofr' AND table_name = ${table_name};
      `;
      if (parseInt(targetTableExists[0].count, 10) === 0) continue;

      let retried = 0;
      for (const row of rows) {
        try {
          const keys = Object.keys(row);
          const values = keys.map(k => {
            const val = row[k];
            if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
              return JSON.stringify(val);
            }
            return val;
          });

          await targetSql.unsafe(
            `INSERT INTO icofr."${table_name}" (${keys.map(k => `"${k}"`).join(',')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(',')}) ON CONFLICT DO NOTHING;`,
            values
          );
          retried++;
        } catch (err: any) {
          console.error(`   ❌ Pass 2 error [${table_name}]:`, err.message);
        }
      }
      console.log(` Pass 2 [${table_name}]: Done retrying rows`);
    }

    console.log("\n🎉 Database data copy completed successfully!");
  } catch (error) {
    console.error("❌ Data copy failed:", error);
  } finally {
    await sourceSql.end();
    await targetSql.end();
  }
}

copyData();
