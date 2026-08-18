import bcrypt from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { recoveryCodes, users } from "@/db/schema";
import { recoveryCodeHash, writeSecurityLog } from "@/lib/security";
import { clearAttempts, consumeAttempt } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(10).max(40),
  newPassword: z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
});

export async function POST(request: Request) {
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  const rateLimit = consumeAttempt(`recovery:${client}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) return Response.json({ message: "Trop de tentatives. Réessayez plus tard." }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: "Informations invalides ou mot de passe insuffisamment robuste." }, { status: 400 });

  const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email.toLowerCase()) });
  const recovery = user ? await db.query.recoveryCodes.findFirst({ where: and(eq(recoveryCodes.userId, user.id), eq(recoveryCodes.codeHash, recoveryCodeHash(parsed.data.code)), isNull(recoveryCodes.usedAt)) }) : null;
  if (!user || !recovery) {
    await writeSecurityLog("LOGIN_FAILURE", request.headers, { userId: user?.id, details: "Code de récupération invalide" });
    return Response.json({ message: "Le code de récupération est invalide ou déjà utilisé." }, { status: 400 });
  }

  const now = new Date();
  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.transaction(async tx => {
    await tx.update(recoveryCodes).set({ usedAt: now }).where(eq(recoveryCodes.id, recovery.id));
    await tx.update(users).set({ passwordHash, passwordChangedAt: now, failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.id, user.id));
  });
  await writeSecurityLog("RECOVERY_CODE_USED", request.headers, { userId: user.id });
  clearAttempts(`recovery:${client}`);
  return Response.json({ message: "Mot de passe réinitialisé. Vous pouvez maintenant vous connecter." });
}
