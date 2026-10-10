const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_xXdSNh8Jf2Hw@ep-red-morning-azj1g0gk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  const connIdStr = '9';
  const mrRows = await sql.query(`
    SELECT DISTINCT ON (mr.billing_period_id) 
      mr.id, mr.billing_period_id, mr.reading_date, mr.previous_reading, mr.current_reading, mr.usage_m3, mr.notes,
      bp.name as period_name, bp.year, bp.month
    FROM meter_readings mr
    LEFT JOIN billing_periods bp ON CAST(mr.billing_period_id AS integer) = bp.id
    WHERE CAST(mr.connection_id AS text) = $1
    ORDER BY mr.billing_period_id, mr.id DESC
  `, [connIdStr]);

  console.log('Distinct MR rows:', mrRows);
}

main().catch(console.error);
