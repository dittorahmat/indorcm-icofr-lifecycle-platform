import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../worker/db/schema';
import { eq } from 'drizzle-orm';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL_MISSING: set DATABASE_URL before running check-simulations');

async function check() {
    console.log("🔍 Checking Simulations Content...");
    const client = neon(url);
    const db = drizzle(client, { schema });

    const sims = await db.select().from(schema.simulations);
    console.log(`\n📊 Simulations found: ${sims.length}`);
    
    sims.forEach(s => {
        console.log(`\n--- Simulation: ${s.name} (Status: ${s.status}, Year: ${s.year}) ---`);
        const accounts = s.significantAccounts as any[];
        if (accounts && Array.isArray(accounts)) {
            console.log(`Significant Accounts (${accounts.length}):`);
            accounts.slice(0, 5).forEach(a => {
                console.log(` - name: "${a.name}", fsliCode: "${a.fsliCode}"`);
            });
            if (accounts.length > 5) console.log(` ... and ${accounts.length - 5} more`);
        } else {
            console.log("No significant accounts data found.");
        }
    });
}

check().catch(console.error);
