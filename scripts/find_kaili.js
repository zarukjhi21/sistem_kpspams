const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_xXdSNh8Jf2Hw@ep-red-morning-azj1g0gk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  console.log('Querying all tables in PostgreSQL database for "Kaili"...');

  // List all tables
  const tables = await sql.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `);

  for (const { table_name } of tables) {
    try {
      const rows = await sql.query(`SELECT * FROM ${table_name}`);
      for (const row of rows) {
        const json = JSON.stringify(row);
        if (/kaili/i.test(json) || /wai/i.test(json)) {
          console.log(`Found in table "${table_name}":`, json);
        }
      }
    } catch (e) {
      console.error(`Error querying ${table_name}:`, e.message);
    }
  }
}

main().catch(console.error);
