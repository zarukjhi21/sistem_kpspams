const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_xXdSNh8Jf2Hw@ep-red-morning-azj1g0gk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  const conns = await sql.query(`
    SELECT c.id, c.code, c.full_name, c.dusun, c.rt_rw,
           co.connection_no, co.latitude, co.longitude, co.status
    FROM customers c
    JOIN connections co ON c.id = CAST(co.customer_id AS integer)
    WHERE CAST(c.kpspams_id AS integer) = 1 
      AND (c.status = 'ACTIVE' OR c.status = 'active') 
      AND c.deleted_at IS NULL
    ORDER BY c.id ASC
  `);
  console.log('Active connections count for KPSPAMS 1:', conns.length);
  console.log('First 5:', conns.slice(0, 5));
}

main().catch(console.error);
