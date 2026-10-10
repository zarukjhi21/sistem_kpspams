const { neon } = require('@neondatabase/serverless');

const NEON_DB_URL = "postgresql://neondb_owner:npg_xXdSNh8Jf2Hw@ep-red-morning-azj1g0gk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function testBatchSql() {
  const sql = neon(NEON_DB_URL);
  
  // Test query to retrieve active connections with latest meter reading
  const rows = await sql.query(`
    SELECT conn.id as connection_id, conn.connection_no, conn.meter_id, conn.customer_id, c.full_name, c.kpspams_id,
           COALESCE(mr.current_reading::text, m.initial_reading::text, '0') as latest_reading
    FROM connections conn
    JOIN customers c ON CAST(conn.customer_id AS integer) = c.id
    LEFT JOIN meters m ON CAST(conn.meter_id AS integer) = m.id
    LEFT JOIN LATERAL (
      SELECT current_reading FROM meter_readings 
      WHERE connection_id = conn.id::text OR connection_id = c.id::text 
      ORDER BY id DESC LIMIT 1
    ) mr ON true
    WHERE c.deleted_at IS NULL AND conn.status = 'ACTIVE'
    ORDER BY c.id ASC
  `);
  
  console.log(`Found ${rows.length} active connections.`);
  console.log("Sample 1:", rows[0]);
  console.log("Sample last:", rows[rows.length - 1]);
}

testBatchSql().catch(console.error);
