import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_X1RhxQpIm6LT@ep-delicate-hat-a1mg138i-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require");
async function run() {
  console.log("Checking simulations...");
  const sims = await sql`SELECT id, year, status, significant_accounts FROM simulations WHERE status = 'Approved' ORDER BY created_at DESC LIMIT 1`;
  if (sims.length > 0) {
    const sim = sims[0];
    console.log("Active sim year:", sim.year);
    console.log("Significant Accounts:", JSON.stringify(sim.significant_accounts, null, 2));
  } else {
    console.log("No active simulation found.");
  }
}
run().catch(console.error);