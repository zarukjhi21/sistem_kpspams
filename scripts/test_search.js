const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_xXdSNh8Jf2Hw@ep-red-morning-azj1g0gk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function test(query) {
  const custRows = await sql.query(`
    SELECT c.*, 
      conn.id as connection_id, conn.connection_no, conn.status as connection_status,
      m.serial_number as meter_serial, m.brand as meter_brand, m.initial_reading as meter_initial,
      k.name as kpspams_name, k.id as kpspams_id, k.contact_phone as kpspams_phone, k.bank_account_info as kpspams_bank,
      ct.name as tariff_name
    FROM customers c
    LEFT JOIN connections conn ON c.id = CAST(conn.customer_id AS integer)
    LEFT JOIN meters m ON CAST(conn.meter_id AS integer) = m.id
    LEFT JOIN kpspams k ON CAST(c.kpspams_id AS integer) = k.id
    LEFT JOIN customer_types ct ON CAST(c.customer_type_id AS integer) = ct.id
    WHERE (
      c.nik = $1 
      OR c.nik ILIKE '%' || $1 || '%'
      OR conn.connection_no ILIKE '%' || $1 || '%' 
      OR c.phone ILIKE '%' || $1 || '%' 
      OR c.code ILIKE '%' || $1 || '%'
      OR c.full_name ILIKE '%' || $1 || '%'
    )
    AND c.deleted_at IS NULL
    LIMIT 5
  `, [query]);
  console.log(`Query "${query}":`, custRows.map(r => ({ id: r.id, name: r.full_name, sr: r.connection_no, dusun: r.dusun, phone: r.kpspams_phone })));
}

async function main() {
  await test('00009');
  await test('Syaharuddin');
  await test('syahar');
  await test('7604062111950003');
  await test('Mustari');
}

main().catch(console.error);
