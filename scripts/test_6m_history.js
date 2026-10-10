const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_xXdSNh8Jf2Hw@ep-red-morning-azj1g0gk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  const connIdStr = '9';
  const kpspamsIdStr = '1';

  // Get the last 6 billing periods for this KPSPAMS
  const bps = await sql.query(`
    SELECT id, name, month, year 
    FROM billing_periods 
    WHERE CAST(kpspams_id AS text) = $1
    ORDER BY id ASC
    LIMIT 6
  `, [kpspamsIdStr]);

  // Get meter readings for this connection
  const mrs = await sql.query(`
    SELECT DISTINCT ON (billing_period_id)
      billing_period_id, usage_m3, previous_reading, current_reading, reading_date
    FROM meter_readings
    WHERE CAST(connection_id AS text) = $1
    ORDER BY billing_period_id, id DESC
  `, [connIdStr]);

  const mrMap = new Map();
  for (const mr of mrs) {
    mrMap.set(String(mr.billing_period_id), mr);
  }

  const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const history = bps.map(bp => {
    const mr = mrMap.get(String(bp.id));
    const mNum = parseInt(bp.month, 10) || 10;
    const shortMonth = `${monthNames[mNum]} '${String(bp.year).slice(-2)}`;
    return {
      period_id: bp.id,
      period_name: bp.name,
      month: shortMonth,
      usage_m3: mr ? Number(mr.usage_m3) || 0 : 0,
      previous_reading: mr ? Number(mr.previous_reading) || 0 : 0,
      current_reading: mr ? Number(mr.current_reading) || 0 : 0,
      has_reading: !!mr
    };
  });

  console.log('Clean 6-month history:', history);
}

main().catch(console.error);
