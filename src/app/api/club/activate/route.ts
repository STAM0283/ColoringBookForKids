import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { clubCodes, clubSessions } from "@/db/schema";
import { CLUB_COOKIE, buyerCookie, createClubSessionToken, hashClubValue, normalizeClubCode } from "@/lib/club-access";
import { clearAttempts, consumeAttempt } from "@/lib/rate-limit";

const schema = z.object({ code: z.string().min(8).max(32), bookId: z.string().uuid().nullable().optional().default(null) });

export async function POST(request: Request) {
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  const rateLimit = consumeAttempt(`club:${client}`);
  if (!rateLimit.allowed) return Response.json({ message: "Trop de tentatives. Réessayez dans quelques minutes." }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: "Saisissez un code valide." }, { status: 400 });
  const now = new Date();
  const normalized = normalizeClubCode(parsed.data.code);
  const [code] = await db.select().from(clubCodes).where(and(eq(clubCodes.codeHash, hashClubValue(normalized)), eq(clubCodes.status, "ACTIVE"), gt(clubCodes.expiresAt, now))).limit(1);
  if (!code) return Response.json({ message: "Ce code est invalide, expiré ou déjà utilisé." }, { status: 400 });

  if (parsed.data.bookId !== code.bookId) return Response.json({ message: "Ce code ne correspond pas à cet accès." }, { status: 403 });
  const token = createClubSessionToken();
  const expiresAt = new Date(Date.now() + code.accessDurationMinutes * 60_000);
  try {
    await db.transaction(async transaction => {
      const claimed = await transaction.update(clubCodes).set({ status: "REDEEMED", redeemedAt: now }).where(and(eq(clubCodes.id, code.id), eq(clubCodes.status, "ACTIVE"), gt(clubCodes.expiresAt, now))).returning({id:clubCodes.id});
      if (claimed.length !== 1) throw new Error("CODE_ALREADY_USED");
      await transaction.insert(clubSessions).values({ id: crypto.randomUUID(), accessCodeId: code.id, tokenHash: hashClubValue(token), expiresAt });
    });
  } catch {
    return Response.json({ message: "Ce code vient d’être utilisé ou n’est plus disponible." }, { status: 409 });
  }
  (await cookies()).set(code.bookId ? buyerCookie(code.bookId) : CLUB_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt });
  clearAttempts(`club:${client}`);
  return Response.json({ message: code.bookId ? "Bonus du livre débloqués." : "Bienvenue dans le Club du Petit Crayon !", bookId: code.bookId, expiresAt });
}
