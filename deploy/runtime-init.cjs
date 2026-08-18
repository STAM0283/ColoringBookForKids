/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");
const { drizzle } = require("drizzle-orm/better-sqlite3");
const { migrate } = require("drizzle-orm/better-sqlite3/migrator");
const { checkEnvironment } = require("./check-env.cjs");

async function main() {
  checkEnvironment();
  const databasePath = process.env.DATABASE_PATH;
  const backupRoot = process.env.BACKUP_ROOT;
  const bundledMigrations = path.join(__dirname, "migrations");
  const sourceMigrations = path.resolve(__dirname, "../src/db/migrations");
  const migrationsFolder = fs.existsSync(bundledMigrations) ? bundledMigrations : sourceMigrations;
  if (!fs.existsSync(migrationsFolder)) throw new Error(`Migrations introuvables : ${migrationsFolder}`);
  const migrationMarker = path.join(path.dirname(databasePath), ".migration-fingerprint");
  const migrationFingerprint = crypto.createHash("sha256")
    .update(fs.readdirSync(migrationsFolder).filter(file => file.endsWith(".sql")).sort().map(file => fs.readFileSync(path.join(migrationsFolder, file))).join("\n"))
    .digest("hex");
  fs.mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o750 });
  fs.mkdirSync(backupRoot, { recursive: true, mode: 0o750 });

  const existed = fs.existsSync(databasePath);
  const sqlite = new Database(databasePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");

  const previousFingerprint = fs.existsSync(migrationMarker) ? fs.readFileSync(migrationMarker, "utf8").trim() : "";
  if (existed && previousFingerprint !== migrationFingerprint) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await sqlite.backup(path.join(backupRoot, `pre-migration-${stamp}.db`));
  }

  migrate(drizzle(sqlite), { migrationsFolder });
  fs.writeFileSync(migrationMarker, `${migrationFingerprint}\n`, { mode: 0o640 });

  const now = Math.floor(Date.now() / 1000);
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  sqlite.prepare(`INSERT OR IGNORE INTO users
    (id,name,email,password_hash,role,failed_login_attempts,created_at,updated_at)
    VALUES (?,?,?,?,?,0,?,?)`).run("user-admin", "Administrateur", process.env.ADMIN_EMAIL.trim().toLowerCase(), passwordHash, "ADMIN", now, now);

  const settings = [
    ["site.name", "Le Petit Crayon", "STRING"],
    ["pagination.books", "12", "NUMBER"],
    ["pagination.activities", "24", "NUMBER"],
    ["pagination.blog", "10", "NUMBER"],
    ["pagination.admin", "20", "NUMBER"],
    ["pagination.media", "30", "NUMBER"],
  ];
  const insertSetting = sqlite.prepare("INSERT OR IGNORE INTO settings (key,value,type,updated_at) VALUES (?,?,?,?)");
  sqlite.transaction(() => settings.forEach(setting => insertSetting.run(...setting, now)))();
  sqlite.prepare("UPDATE settings SET value = ?, updated_at = ? WHERE key = ?").run("Le Petit Crayon", now, "site.name");
  sqlite.close();
  console.log(`SQLite initialisée : ${databasePath}`);
}

main().catch(error => { console.error(error); process.exit(1); });
