import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DIRECT_URL,
});

async function main() {
  await client.connect();

  try {
    const areaRes = await client.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'Area\'');
    console.log("Area columns:", areaRes.rows.map(r => r.column_name));
  } catch (e) {
    console.error("Area Error:", e);
  }

  try {
    const itemRes = await client.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'Item\'');
    console.log("Item columns:", itemRes.rows.map(r => r.column_name));
  } catch (e) {
    console.error("Item Error:", e);
  }
  
  try {
    const projRes = await client.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'Project\'');
    console.log("Project columns:", projRes.rows.map(r => r.column_name));
  } catch (e) {
    console.error("Project Error:", e);
  }

}

main().catch(console.error).finally(() => client.end());
