import crypto from "node:crypto";
import { db } from "@/db";
import { securityLogs } from "@/db/schema";
import { getAuthSecret } from "@/lib/server-env";

export type SecurityEvent = typeof securityLogs.$inferInsert.event;

function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || null;
}

function hashPrivateValue(value: string) {
  return crypto.createHmac("sha256", getAuthSecret()).update(value).digest("hex");
}

export function recoveryCodeHash(code: string) {
  return hashPrivateValue(`recovery:${code.trim().toUpperCase().replace(/\s/g, "")}`);
}

export function generateRecoveryCode() {
  return crypto.randomBytes(8).toString("hex").toUpperCase().match(/.{1,4}/g)!.join("-");
}

export async function writeSecurityLog(event: SecurityEvent, requestHeaders: Headers, options: { userId?: string | null; details?: string } = {}) {
  const ip = clientIp(requestHeaders);
  await db.insert(securityLogs).values({
    id: crypto.randomUUID(),
    userId: options.userId ?? null,
    event,
    ipHash: ip ? hashPrivateValue(`ip:${ip}`) : null,
    userAgent: requestHeaders.get("user-agent")?.slice(0, 300) || null,
    details: options.details?.slice(0, 500) || null,
  });
}
