/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";

const path = require("node:path");

const placeholders = new Set([
  "replace-with-a-random-production-secret",
  "replace-with-openssl-rand-base64-32",
]);

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} est obligatoire.`);
  return value;
}

function checkEnvironment() {
  if (required("APP_ENV") !== "production") throw new Error("APP_ENV doit valoir production.");
  const secret = required("AUTH_SECRET");
  if (secret.length < 32 || placeholders.has(secret)) throw new Error("AUTH_SECRET est absent ou non sécurisé.");

  const site = new URL(required("NEXT_PUBLIC_SITE_URL"));
  if (site.protocol !== "https:" || ["localhost", "127.0.0.1", "example.com"].includes(site.hostname)) {
    throw new Error("NEXT_PUBLIC_SITE_URL doit contenir le véritable domaine HTTPS.");
  }

  const email = required("ADMIN_EMAIL");
  if (!/^\S+@\S+\.\S+$/.test(email) || email.endsWith("@example.com")) throw new Error("ADMIN_EMAIL est invalide.");
  const password = required("ADMIN_PASSWORD");
  if (password.length < 12 || password.includes("replace-with") || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^\w\s]/.test(password)) throw new Error("ADMIN_PASSWORD est insuffisant.");
  if (required("AUTH_TRUST_HOST") !== "true") throw new Error("AUTH_TRUST_HOST doit valoir true.");

  for (const name of ["DATABASE_PATH", "MEDIA_ROOT", "BACKUP_ROOT"]) {
    if (!path.isAbsolute(required(name))) throw new Error(`${name} doit être absolu.`);
  }
  const capacity = Number(process.env.STORAGE_CAPACITY_BYTES || process.env.OVH_STORAGE_CAPACITY_BYTES);
  if (!Number.isSafeInteger(capacity) || capacity <= 0) throw new Error("STORAGE_CAPACITY_BYTES est invalide.");
}

if (require.main === module) {
  checkEnvironment();
  console.log("Configuration de production valide.");
}

module.exports = { checkEnvironment };
