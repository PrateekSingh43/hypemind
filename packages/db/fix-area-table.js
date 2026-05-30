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
    console.log("Adding deletedAt to Area table...");
    await client.query('ALTER TABLE "Area" ADD COLUMN "deletedAt" timestamp(3) without time zone;');
    console.log("Added deletedAt.");
  } catch (e) {
    console.error("Error adding deletedAt:", e.message);
  }

  try {
    console.log("Adding isPinned to Area table...");
    await client.query('ALTER TABLE "Area" ADD COLUMN "isPinned" boolean NOT NULL DEFAULT false;');
    console.log("Added isPinned.");
  } catch (e) {
    console.error("Error adding isPinned:", e.message);
  }

  try {
    console.log("Adding pinnedAt to Area table...");
    await client.query('ALTER TABLE "Area" ADD COLUMN "pinnedAt" timestamp(3) without time zone;');
    console.log("Added pinnedAt.");
  } catch (e) {
    console.error("Error adding pinnedAt:", e.message);
  }

}

main().catch(console.error).finally(() => client.end());
