const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_xXdSNh8Jf2Hw@ep-red-morning-azj1g0gk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  const conns = await sql.query("SELECT * FROM connections WHERE connection_no ILIKE '%00009%' OR connection_no ILIKE '%0009%'");
  console.log('Conns for 00009:', conns);

  if (conns[0]) {
    const cust = await sql.query('SELECT * FROM customers WHERE id = $1', [conns[0].customer_id]);
    console.log('Customer for 00009:', cust[0]);

    const invs = await sql.query('SELECT * FROM invoices WHERE customer_id = $1 OR connection_id = $2', [conns[0].customer_id, conns[0].id]);
    console.log('Invoices for 00009:', invs);

    const mrs = await sql.query('SELECT * FROM meter_readings WHERE connection_id = $1 OR connection_id = $2', [conns[0].id, String(conns[0].id)]);
    console.log('Meter Readings for 00009:', mrs);
  }
}

main().catch(console.error);
