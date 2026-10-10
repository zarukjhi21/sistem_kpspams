const { neon } = require('@neondatabase/serverless');

const NEON_DB_URL = "postgresql://neondb_owner:npg_xXdSNh8Jf2Hw@ep-red-morning-azj1g0gk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function testTransactionSyntax() {
  const sql = neon(NEON_DB_URL);
  console.log("Testing SQL multi-row syntax with mock data...");

  const activeConns = await sql.query(`
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

  console.log(`Active conns: ${activeConns.length}`);

  // Test building the queries
  const invoiceValues = [];
  const invoiceParams = [];
  let pIdx = 1;
  const novBpId = '9999';

  for (const c of activeConns) {
    const srCode = (c.connection_no || `SR-${c.connection_id}`).replace(/[^A-Za-z0-9]/g, "").slice(-6);
    const invNum = `INV/202611/KP01/${srCode.toUpperCase()}`;

    invoiceValues.push(`($${pIdx}, $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3}, $${pIdx + 4}, '2026-11-01 00:00:00+00', '2026-11-20 23:59:59+00', '0', '0', '10000', '0', '0', '10000', '0', '10000', 'UNPAID', NOW(), NOW())`);
    invoiceParams.push(
      String(c.kpspams_id || 1),
      novBpId,
      String(c.connection_id),
      String(c.customer_id),
      invNum
    );
    pIdx += 5;
  }

  console.log(`Invoice values count: ${invoiceValues.length}, params count: ${invoiceParams.length}`);

  const readingValues = [];
  const readingParams = [];
  let rIdx = 1;

  for (const c of activeConns) {
    readingValues.push(`($${rIdx}, $${rIdx + 1}, $${rIdx + 2}, $${rIdx + 3}, '2026-11-01', $${rIdx + 4}, $${rIdx + 5}, '0', 'PENDING', 'Stand awal otomatis dari tutup buku Oktober', NOW(), NOW())`);
    readingParams.push(
      String(c.kpspams_id || 1),
      novBpId,
      String(c.connection_id),
      String(c.meter_id || ''),
      String(c.latest_reading || '0'),
      String(c.latest_reading || '0')
    );
    rIdx += 6;
  }

  console.log(`Reading values count: ${readingValues.length}, params count: ${readingParams.length}`);
  console.log("Syntax generator test successful!");
}

testTransactionSyntax().catch(console.error);
