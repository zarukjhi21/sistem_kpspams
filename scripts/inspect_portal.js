const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_xXdSNh8Jf2Hw@ep-red-morning-azj1g0gk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  const cust = await sql.query("SELECT * FROM customers WHERE full_name ILIKE '%syaharuddin%' OR id = 9");
  console.log('Customer:', cust[0]);
  if (!cust[0]) return;

  const cid = cust[0].id;
  const conns = await sql.query('SELECT * FROM connections WHERE customer_id = $1 OR customer_id = $2', [cid, String(cid)]);
  console.log('Connections:', conns);

  const invs = await sql.query('SELECT * FROM invoices WHERE customer_id = $1 OR customer_id = $2', [cid, String(cid)]);
  console.log('Invoices:', invs);

  if (conns.length > 0) {
    const connId = conns[0].id;
    const mrs = await sql.query('SELECT * FROM meter_readings WHERE connection_id = $1 OR connection_id = $2', [connId, String(connId)]);
    console.log('Meter Readings:', mrs);
  }

  const bp = await sql.query('SELECT * FROM billing_periods ORDER BY id ASC');
  console.log('Billing Periods:', bp);
}

main().catch(console.error);
