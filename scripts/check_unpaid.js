const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_xXdSNh8Jf2Hw@ep-red-morning-azj1g0gk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  const res = await sql.query(`
    SELECT c.id, c.full_name, conn.connection_no, c.phone, c.dusun,
           inv.id as invoice_id, inv.status as invoice_status, inv.total_amount
    FROM customers c
    LEFT JOIN connections conn ON c.id = CAST(conn.customer_id AS integer)
    LEFT JOIN invoices inv ON c.id = CAST(inv.customer_id AS integer) AND inv.billing_period_id = '6'
    WHERE c.deleted_at IS NULL
    ORDER BY c.id ASC
  `);
  const unpaid = res.filter(r => r.invoice_status !== 'PAID');
  console.log('Total customers:', res.length);
  console.log('Unpaid / No Invoice in Oct:', unpaid.length);
  console.log('Sample unpaid:', unpaid);
}

main().catch(console.error);
