import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_X1RhxQpIm6LT@ep-delicate-hat-a1mg138i-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require");
async function run() {
  console.log("Checking simulation gl_snapshot_id...");
  const simData = await sql`SELECT id, year, status, gl_snapshot_id FROM simulations LIMIT 10`;
  console.log(simData);
}
run().catch(console.error);