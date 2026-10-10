const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_xXdSNh8Jf2Hw@ep-red-morning-azj1g0gk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function checkRiswan() {
  const c = await sql.query(`
    SELECT c.id, c.full_name, c.nik, c.phone, c.identity_address, c.rt_rw, c.dusun,
           conn.connection_no, conn.latitude, conn.longitude,
           m.serial_number, m.initial_reading
    FROM customers c
    LEFT JOIN connections conn ON c.id = CAST(conn.customer_id as integer)
    LEFT JOIN meters m ON CAST(conn.meter_id as integer) = m.id
    WHERE c.id IN (55, 56)
  `);
  console.log(JSON.stringify(c, null, 2));
}
checkRiswan();
