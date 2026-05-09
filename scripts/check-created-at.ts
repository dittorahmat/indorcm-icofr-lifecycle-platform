import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { simulations } from '../worker/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function checkCreatedAt() {
  console.log('--- CHECKING CREATED AT ---');
  
  const approvedSims = await db.select().from(simulations).where(eq(simulations.status, 'Approved'));
  
  approvedSims.forEach(sim => {
    console.log(`Name: ${sim.name}, ID: ${sim.id}, CreatedAt: ${sim.createdAt}`);
  });
  
  process.exit(0);
}

checkCreatedAt().catch(console.error);
