const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_xXdSNh8Jf2Hw@ep-red-morning-azj1g0gk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function inspect() {
  try {
    const periods = await sql`SELECT * FROM billing_periods ORDER BY id ASC`;
    console.log("BILLING PERIODS:");
    console.table(periods);

    const invoices = await sql`SELECT billing_period_id, status, count(*), sum(total_amount::numeric) as total_val FROM invoices GROUP BY billing_period_id, status`;
    console.log("INVOICES BY PERIOD & STATUS:");
    console.table(invoices);

    const mrCount = await sql`SELECT billing_period_id, count(*) FROM meter_readings GROUP BY billing_period_id`;
    console.log("METER READINGS BY PERIOD:");
    console.table(mrCount);

  } catch (err) {
    console.error("Error inspecting:", err);
  }
}

inspect();
