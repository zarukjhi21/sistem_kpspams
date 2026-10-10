const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_xXdSNh8Jf2Hw@ep-red-morning-azj1g0gk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  console.log('Updating cash_accounts ID 1 with real opening balance Rp 29.766.000...');

  // Check sum of financial_transactions for account 1
  const netTx = await sql.query(`
    SELECT COALESCE(SUM(CASE WHEN transaction_type = 'INCOME' THEN CAST(amount AS numeric) ELSE -CAST(amount AS numeric) END), 0) as net
    FROM financial_transactions WHERE CAST(cash_account_id AS text) = '1'
  `);
  const net = parseFloat(netTx[0]?.net) || 0;
  console.log('Net transactions in app (Iuran 37 SR):', net);

  const opening = 29766000;
  const current = opening + net;
  console.log(`Calculation: Saldo Awal (${opening}) + Net Masuk (${net}) = Total Saldo (${current})`);

  await sql.query(`
    UPDATE cash_accounts SET
      account_name = $1,
      opening_balance = $2,
      opening_balance_date = $3,
      opening_balance_notes = $4,
      current_balance = $5,
      updated_at = NOW()
    WHERE id = 1
  `, [
    'Kas Operasional KPSPAMS Lemo Baru',
    opening.toString(),
    '2026-10-01',
    'Saldo awal kas riil pengurus KPSPAMS Lemo Baru sebelum penerapan aplikasi digital',
    current.toString()
  ]);

  const acc = await sql.query('SELECT * FROM cash_accounts WHERE id = 1');
  console.log('Successfully updated account ID 1:', acc[0]);
}

main().catch(err => {
  console.error('Error updating cash account:', err);
  process.exit(1);
});
