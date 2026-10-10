const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_xXdSNh8Jf2Hw@ep-red-morning-azj1g0gk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function inspectPairs() {
  const ids = [83, 84, 87, 88, 55, 56, 26, 70];
  const custs = await sql.query(`
    SELECT c.id, c.code, c.full_name, c.nik, c.phone, c.created_at,
           conn.id as conn_id, conn.connection_no,
           inv.id as inv_id, inv.status as inv_status, inv.total_amount
    FROM customers c
    LEFT JOIN connections conn ON c.id = CAST(conn.customer_id as integer)
    LEFT JOIN invoices inv ON c.id = CAST(inv.customer_id as integer)
    WHERE c.id = ANY($1)
    ORDER BY c.full_name, c.id
  `, [ids]);

  console.log(JSON.stringify(custs, null, 2));
}

inspectPairs();
