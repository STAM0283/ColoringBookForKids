import crypto from "node:crypto";
import { and, eq, gt, ne, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { clubCodes, clubSessions } from "@/db/schema";
import { getAuthSecret } from "@/lib/server-env";

export const CLUB_COOKIE = "petits-crayons-club";
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function pepper() {
  return getAuthSecret();
}

export function hashClubValue(value: string) {
  return crypto.createHmac("sha256", pepper()).update(value.trim().toUpperCase()).digest("hex");
}

export function normalizeClubCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function generateClubCode() {
  const random = Array.from(crypto.randomBytes(8), byte => alphabet[byte % alphabet.length]).join("");
  return `CRAYON-${random.slice(0, 4)}-${random.slice(4)}`;
}

export function clubCodeHint(code: string) {
  const normalized = normalizeClubCode(code);
  return `${normalized.slice(0, 6)}••••${normalized.slice(-4)}`;
}

export function buyerCookie(bookId: string) { return `petits-crayons-book-${bookId}`; }

export async function getClubSession(bookId?: string) {
  const token = (await cookies()).get(bookId ? buyerCookie(bookId) : CLUB_COOKIE)?.value;
  if (!token) return null;
  const now = new Date();
  const [session] = await db.select({ id: clubSessions.id }).from(clubSessions)
    .innerJoin(clubCodes, eq(clubSessions.accessCodeId, clubCodes.id))
    .where(and(eq(clubSessions.tokenHash, hashClubValue(token)), bookId ? eq(clubCodes.bookId, bookId) : isNull(clubCodes.bookId), gt(clubSessions.expiresAt, now), ne(clubCodes.status, "DISABLED"))).limit(1);
  if (!session) return null;
  await db.update(clubSessions).set({ lastUsedAt: now }).where(eq(clubSessions.id, session.id));
  return session;
}

export async function hasClubAccess() { return Boolean(await getClubSession()); }

export function createClubSessionToken() {
  return crypto.randomBytes(32).toString("base64url");
}
