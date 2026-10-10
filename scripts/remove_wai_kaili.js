const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_xXdSNh8Jf2Hw@ep-red-morning-azj1g0gk-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  console.log('Updating database: replacing "Wai Kaili" with "Lemo Baru"...');

  // 1. Update kpspams
  await sql.query(`
    UPDATE kpspams SET
      name = 'KPSPAMS Lemo Baru',
      bank_account_info = 'BRI Unit Binuang: 0214-01-002345-53-1 a.n KPSPAMS Lemo Baru',
      updated_at = NOW()
    WHERE id = 1
  `);
  console.log('✓ Updated table kpspams id 1 to "KPSPAMS Lemo Baru"');

  // 2. Update cash_accounts
  await sql.query(`
    UPDATE cash_accounts SET
      account_name = 'Kas Operasional KPSPAMS Lemo Baru',
      opening_balance_notes = 'Saldo awal kas riil pengurus KPSPAMS Lemo Baru sebelum penerapan aplikasi digital',
      updated_at = NOW()
    WHERE id = 1
  `);
  console.log('✓ Updated table cash_accounts id 1 to "Kas Operasional KPSPAMS Lemo Baru"');

  // Verify
  const kpspams = await sql.query('SELECT id, name, bank_account_info FROM kpspams WHERE id = 1');
  console.log('kpspams row 1:', kpspams[0]);

  const cash = await sql.query('SELECT id, account_name, opening_balance_notes FROM cash_accounts WHERE id = 1');
  console.log('cash_accounts row 1:', cash[0]);
}

main().catch(err => {
  console.error('Update failed:', err);
  process.exit(1);
});
