const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_xXdSNh8Jf2Hw@ep-red-morning-azj1g0gk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function inspectColumns() {
  const invCols = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'invoices'
    ORDER BY ordinal_position
  `;
  console.log("INVOICES COLUMNS:");
  console.table(invCols);

  const bpCols = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'billing_periods'
    ORDER BY ordinal_position
  `;
  console.log("BILLING_PERIODS COLUMNS:");
  console.table(bpCols);

  const mrCols = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'meter_readings'
    ORDER BY ordinal_position
  `;
  console.log("METER_READINGS COLUMNS:");
  console.table(mrCols);
}

inspectColumns().catch(console.error);
