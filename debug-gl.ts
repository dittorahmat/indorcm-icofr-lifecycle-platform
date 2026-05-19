import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_X1RhxQpIm6LT@ep-delicate-hat-a1mg138i-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require");
async function run() {
  const activeSnapId = "0abfe6cb-044b-40c5-a49a-ae09af8b6945";
  console.log("Checking Kas in active snapshot");
  const rows = await sql`SELECT fsli_name, fsli_code, no_gl, gl_desc FROM gl_rows WHERE snapshot_id = ${activeSnapId} AND fsli_name ILIKE '%Kas%' LIMIT 5`;
  console.log(rows);
}
run().catch(console.error);