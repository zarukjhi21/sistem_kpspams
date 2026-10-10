const { neon } = require('@neondatabase/serverless');

const NEON_DB_URL = "postgresql://neondb_owner:npg_xXdSNh8Jf2Hw@ep-red-morning-azj1g0gk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function test() {
  const sql = neon(NEON_DB_URL);
  try {
    const email = 'admin@kuajang.desa.id';
    const res1 = await sql`SELECT id, name FROM users WHERE email = ${email}`;
    console.log('Tagged template success:', res1);

    const res2 = await sql.query('SELECT id, name FROM users WHERE email = $1', [email]);
    console.log('sql.query with params:', res2);
  } catch (err) {
    console.error('Error occurred:', err);
  }
}

test();
