import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../worker/db/schema';
import { sql } from 'drizzle-orm';

async function migrateData() {
    console.log("🚀 Starting GL snapshots year migration...");
    
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
        console.error("❌ Error: DATABASE_URL not found in environment variables.");
        process.exit(1);
    }

    const client = neon(dbUrl);
    const db = drizzle(client, { schema });

    try {
        console.log("⏳ Backfilling year column for existing gl_snapshots...");
        
        await db.execute(sql`
            UPDATE gl_snapshots 
            SET year = COALESCE(
                (
                    SELECT CAST(SUBSTRING(gl_rows.ymd FROM 1 FOR 4) AS INTEGER) 
                    FROM gl_rows 
                    WHERE gl_rows.snapshot_id = gl_snapshots.id 
                    AND gl_rows.ymd ~ '^[0-9]{4}'
                    LIMIT 1
                ),
                2026
            )
            WHERE year IS NULL;
        `);

        console.log("✅ GL snapshots year backfilled successfully!");

        // Show sample results
        const items = await db.select({
            id: schema.glSnapshots.id,
            filename: schema.glSnapshots.filename,
            year: schema.glSnapshots.year
        }).from(schema.glSnapshots);

        console.log("\n📊 GL Snapshots after migration:");
        console.table(items);

    } catch (error) {
        console.error("❌ Migration failed:", error);
    }
}

migrateData();
