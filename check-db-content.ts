import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './worker/db/schema';
import { eq } from 'drizzle-orm';

const url = "postgres://indouser:indopassword@localhost:5432/indorcm_db"; // Asumsi localhost

async function check() {
    console.log("🔍 Checking Database Content...");
    const client = neon(process.env.DATABASE_URL!);
    const db = drizzle(client, { schema });

    const users = await db.select().from(schema.user);
    console.log(`\n👥 Users found: ${users.length}`);
    users.forEach(u => console.log(` - ID: ${u.id}, Email: ${u.email}`));

    const accounts = await db.select().from(schema.account);
    console.log(`\n🔐 Accounts found: ${accounts.length}`);
    accounts.forEach(a => console.log(` - UserID: ${a.userId}, AccountID: ${a.accountId}, Provider: ${a.providerId}`));
}

check().catch(console.error);
