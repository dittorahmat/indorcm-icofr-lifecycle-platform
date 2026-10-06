import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../worker/db/schema';
import { or, eq, like } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.DATABASE_URL;

async function check() {
    const client = neon(url!);
    const db = drizzle(client, { schema });

    console.log(`\n🔍 Checking all bpmProcesses for GL 10008-000318 or Name matching...`);
    const results = await db.select().from(schema.bpmProcesses).where(
        or(
            eq(schema.bpmProcesses.noGL, '10008-000318'),
            like(schema.bpmProcesses.name, '%Penerimaan Setoran Tunai%')
        )
    );

    console.log(`Found ${results.length} processes:`);
    results.forEach(p => {
        console.log(` - ID=${p.id}, name="${p.name}", noGL="${p.noGL}", year=${p.year}`);
    });
}

check().catch(console.error);
