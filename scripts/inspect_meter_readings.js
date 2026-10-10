const { neon } = require('@neondatabase/serverless');

const NEON_DB_URL = "postgresql://neondb_owner:npg_xXdSNh8Jf2Hw@ep-red-morning-azj1g0gk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function run() {
  const sql = neon(NEON_DB_URL);
  const cols = await sql.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'meter_readings' 
    ORDER BY ordinal_position
  `);
  console.log("Columns of meter_readings:", cols);

  const sample = await sql.query(`SELECT * FROM meter_readings ORDER BY id DESC LIMIT 3`);
  console.log("Sample meter_readings:", sample);
}

run().catch(console.error);
