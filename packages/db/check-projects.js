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
    const projRes = await client.query('SELECT id, title, "deletedAt" FROM "Project" WHERE "deletedAt" IS NOT NULL');
    console.log("Trashed Projects:", projRes.rows);
  } catch (e) {
    console.error("Project Error:", e);
  }

}

main().catch(console.error).finally(() => client.end());
