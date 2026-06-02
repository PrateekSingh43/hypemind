const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.tbotuhsxxidsvolnrvxh:sN2FOQMXIpU98O1i@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });

async function checkPinned() {
  await client.connect();
  let res = await client.query('SELECT id, title, "isPinned" FROM "Area" WHERE "isPinned" = true');
  console.log('Pinned Areas:', res.rows);
  res = await client.query('SELECT id, title, "isPinned" FROM "Project" WHERE "isPinned" = true');
  console.log('Pinned Projects:', res.rows);
  res = await client.query('SELECT id, title, "isPinned" FROM "Item" WHERE "isPinned" = true');
  console.log('Pinned Items:', res.rows);
  await client.end();
}
checkPinned().catch(console.error);
