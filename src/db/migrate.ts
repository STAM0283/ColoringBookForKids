import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index";

async function main() {
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  console.log("Migrations PostgreSQL appliquées.");
  await pool.end();
}

main().catch(async error => {
  console.error("Échec des migrations PostgreSQL.", error instanceof Error ? error.message : error);
  await pool.end().catch(() => undefined);
  process.exit(1);
});
