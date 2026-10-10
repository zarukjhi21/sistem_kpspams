const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_xXdSNh8Jf2Hw@ep-red-morning-azj1g0gk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function checkDuplicates() {
  console.log('=== CEK DUPLIKAT NAMA PELANGGAN ===');
  const dupNames = await sql.query(`
    SELECT TRIM(UPPER(full_name)) as norm_name, COUNT(*) as cnt, array_agg(id) as ids, array_agg(created_at) as created_ats
    FROM customers
    WHERE deleted_at IS NULL
    GROUP BY TRIM(UPPER(full_name))
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
  `);
  console.log('Duplikat Nama:', JSON.stringify(dupNames, null, 2));

  console.log('\n=== CEK DUPLIKAT NIK PELANGGAN ===');
  const dupNik = await sql.query(`
    SELECT nik, COUNT(*) as cnt, array_agg(id) as ids, array_agg(full_name) as names
    FROM customers
    WHERE deleted_at IS NULL AND nik IS NOT NULL AND TRIM(nik) != ''
    GROUP BY nik
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
  `);
  console.log('Duplikat NIK:', JSON.stringify(dupNik, null, 2));

  console.log('\n=== CEK DUPLIKAT NO TELEPON ===');
  const dupPhone = await sql.query(`
    SELECT phone, COUNT(*) as cnt, array_agg(id) as ids, array_agg(full_name) as names
    FROM customers
    WHERE deleted_at IS NULL AND phone IS NOT NULL AND TRIM(phone) != ''
    GROUP BY phone
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
  `);
  console.log('Duplikat No Telepon:', JSON.stringify(dupPhone, null, 2));

  console.log('\n=== CEK DUPLIKAT CONNECTION NO ===');
  const dupConn = await sql.query(`
    SELECT connection_no, COUNT(*) as cnt, array_agg(id) as ids, array_agg(customer_id) as cust_ids
    FROM connections
    WHERE deleted_at IS NULL
    GROUP BY connection_no
    HAVING COUNT(*) > 1
  `);
  console.log('Duplikat No Sambungan:', JSON.stringify(dupConn, null, 2));
}

checkDuplicates();
