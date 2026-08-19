const insecureAuthSecrets = new Set([
  "replace-with-openssl-rand-base64-32",
  "replace-with-openssl-rand-base64-48",
  "replace-with-a-random-production-secret",
  "development-only-club-secret",
]);

export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET?.trim();

  if (secret && secret.length >= 32 && !insecureAuthSecrets.has(secret)) return secret;
  if (process.env.APP_ENV !== "production") return secret || "development-only-club-secret";

  throw new Error("AUTH_SECRET doit contenir au moins 32 caractères aléatoires en production.");
}

export function assertProductionEnvironment() {
  if (process.env.APP_ENV !== "production") return;

  getAuthSecret();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) throw new Error("NEXT_PUBLIC_SITE_URL est obligatoire en production.");

  const parsed = new URL(siteUrl);
  if (parsed.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL doit utiliser HTTPS en production.");
  }
  if (["localhost", "127.0.0.1", "example.com"].includes(parsed.hostname)) {
    throw new Error("NEXT_PUBLIC_SITE_URL doit contenir le vrai domaine du site en production.");
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl || !databaseUrl.startsWith("postgresql://")) {
    throw new Error("DATABASE_URL doit être une URL PostgreSQL valide.");
  }

  const requiredPaths = ["MEDIA_ROOT", "BACKUP_ROOT"] as const;
  for (const name of requiredPaths) {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`${name} est obligatoire en production.`);
    if (!value.startsWith("/")) throw new Error(`${name} doit être un chemin absolu en production.`);
  }

  const email = process.env.ADMIN_EMAIL?.trim();
  if (!email || !/^\S+@\S+\.\S+$/.test(email) || email.endsWith("@example.com")) {
    throw new Error("ADMIN_EMAIL doit contenir la véritable adresse administrateur.");
  }

  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 12 || password.includes("replace-with") || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^\w\s]/.test(password)) {
    throw new Error("ADMIN_PASSWORD doit être un mot de passe de production long et unique.");
  }

  if (process.env.AUTH_TRUST_HOST !== "true") {
    throw new Error("AUTH_TRUST_HOST doit valoir true derrière le proxy de production.");
  }

  const capacity = Number(process.env.STORAGE_CAPACITY_BYTES || process.env.OVH_STORAGE_CAPACITY_BYTES);
  if (!Number.isSafeInteger(capacity) || capacity <= 0) {
    throw new Error("STORAGE_CAPACITY_BYTES doit contenir la capacité réelle du stockage en octets.");
  }

  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL;
  if (instagramUrl && new URL(instagramUrl).protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_INSTAGRAM_URL doit utiliser HTTPS.");
  }
}
