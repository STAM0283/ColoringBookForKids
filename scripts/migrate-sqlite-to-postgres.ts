import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { Pool, type PoolClient } from "pg";

const tables = [
  "users", "media", "categories", "settings", "social_networks", "club_codes",
  "books", "activities", "posts", "vlogs", "security_logs", "recovery_codes",
  "media_categories", "book_gallery", "activity_categories", "club_sessions",
  "backups", "site_visits",
] as const;

const timestampColumns = new Set([
  "created_at", "updated_at", "locked_until", "password_changed_at", "used_at",
  "price_updated_at", "published_at", "expires_at", "redeemed_at", "last_used_at",
  "completed_at", "first_seen_at", "last_seen_at",
]);
const booleanColumns = new Set(["featured", "published", "download_enabled", "is_active"]);

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function quote(identifier: string) {
  if (!/^[a-z_]+$/.test(identifier)) throw new Error(`Identifiant SQL invalide : ${identifier}`);
  return `"${identifier}"`;
}

function transform(column: string, value: unknown) {
  if (value === null || value === undefined) return null;
  if (timestampColumns.has(column)) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) throw new Error(`Date invalide dans ${column}`);
    return new Date(numeric < 10_000_000_000 ? numeric * 1000 : numeric);
  }
  if (booleanColumns.has(column)) return Boolean(value);
  return value;
}

async function copyTable(sqlite: Database.Database, client: PoolClient, table: string) {
  const exists = sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table);
  if (!exists) {
    console.warn(`[ignorée] table SQLite absente : ${table}`);
    return;
  }
  const rows = sqlite.prepare(`SELECT * FROM ${quote(table)}`).all() as Record<string, unknown>[];
  if (!rows.length) {
    console.log(`[ok] ${table}: 0 ligne`);
    return;
  }
  const columns = Object.keys(rows[0]);
  const columnSql = columns.map(quote).join(", ");
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
  const statement = `INSERT INTO ${quote(table)} (${columnSql}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
  let inserted = 0;
  for (const row of rows) {
    const result = await client.query(statement, columns.map(column => transform(column, row[column])));
    inserted += result.rowCount ?? 0;
  }
  console.log(`[ok] ${table}: ${inserted} insérée(s), ${rows.length - inserted} déjà présente(s)`);
}

async function main() {
  const source = path.resolve(argument("--sqlite") ?? process.env.SQLITE_SOURCE_PATH ?? "./data/database/site.db");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL est obligatoire.");
  if (!fs.existsSync(source)) throw new Error(`Base SQLite introuvable : ${source}`);
  const header = Buffer.alloc(16);
  const descriptor = fs.openSync(source, "r");
  fs.readSync(descriptor, header, 0, 16, 0);
  fs.closeSync(descriptor);
  if (header.toString("utf8") !== "SQLite format 3\0") throw new Error("Le fichier source n’est pas une base SQLite valide.");

  const sqlite = new Database(source, { readonly: true, fileMustExist: true });
  const integrity = sqlite.pragma("integrity_check", { simple: true });
  if (integrity !== "ok") throw new Error("Le contrôle d’intégrité SQLite a échoué.");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const table of tables) await copyTable(sqlite, client, table);
    await client.query("COMMIT");
    console.log("Migration SQLite vers PostgreSQL terminée avec succès.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
    sqlite.close();
  }
}

main().catch(error => {
  console.error("Échec de la migration SQLite vers PostgreSQL :", error instanceof Error ? error.message : error);
  process.exit(1);
});
