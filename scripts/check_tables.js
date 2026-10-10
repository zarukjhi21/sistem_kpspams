const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_xXdSNh8Jf2Hw@ep-red-morning-azj1g0gk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  const tables = ['complaints', 'invoices', 'connections', 'meter_readings', 'meters', 'payments'];
  for (const t of tables) {
    const cols = await sql.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `, [t]);
    console.log(`\n=== Table: ${t} ===`);
    console.log(cols.map(c => `${c.column_name} (${c.data_type})`).join(', '));
  }
}

main().catch(console.error);
