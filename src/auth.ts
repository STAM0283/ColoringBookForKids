import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { writeSecurityLog } from "@/lib/security";
import { clearAttempts, consumeAttempt } from "@/lib/rate-limit";

const credentials = z.object({ email: z.string().email(), password: z.string().min(8).max(128) });
const maximumAttempts = 5;
const lockDurationMs = 15 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/connexion" },
  providers: [Credentials({
    credentials: { email: {}, password: {} },
    authorize: async (raw, request) => {
      const parsed = credentials.safeParse(raw);
      if (!parsed.success) return null;
      const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
      const attemptKey = `login:${client}`;
      if (!consumeAttempt(attemptKey, 20, 15 * 60 * 1000).allowed) {
        await writeSecurityLog("LOGIN_FAILURE", request.headers, { details: "Limite de tentatives atteinte" });
        return null;
      }

      const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email.toLowerCase()) });
      if (!user) {
        await writeSecurityLog("LOGIN_FAILURE", request.headers, { details: "Identifiants invalides" });
        return null;
      }

      const now = new Date();
      if (user.lockedUntil && user.lockedUntil > now) {
        await writeSecurityLog("ACCOUNT_LOCKED", request.headers, { userId: user.id, details: "Tentative pendant le blocage" });
        return null;
      }

      const validPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!validPassword) {
        const previousAttempts = user.lockedUntil ? 0 : user.failedLoginAttempts;
        const attempts = previousAttempts + 1;
        const lockedUntil = attempts >= maximumAttempts ? new Date(now.getTime() + lockDurationMs) : null;
        await db.update(users).set({ failedLoginAttempts: lockedUntil ? 0 : attempts, lockedUntil }).where(eq(users.id, user.id));
        await writeSecurityLog(lockedUntil ? "ACCOUNT_LOCKED" : "LOGIN_FAILURE", request.headers, {
          userId: user.id,
          details: lockedUntil ? "Compte bloqué 15 minutes après 5 échecs" : `Échec ${attempts}/${maximumAttempts}`,
        });
        return null;
      }

      await db.update(users).set({ failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.id, user.id));
      await writeSecurityLog("LOGIN_SUCCESS", request.headers, { userId: user.id });
      clearAttempts(attemptKey);
      return { id: user.id, email: user.email, name: user.name, role: user.role };
    },
  })],
  callbacks: {
    authorized: async ({ auth: session, request }) => !request.nextUrl.pathname.startsWith("/admin") || (!!session?.user && !session.user.invalid),
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = "ADMIN";
        token.sessionStartedAt = Date.now();
      }
      if (token.sub) {
        const current = await db.query.users.findFirst({ where: eq(users.id, token.sub), columns: { passwordChangedAt: true } });
        token.invalid = !current || Boolean(current.passwordChangedAt && current.passwordChangedAt.getTime() > (token.sessionStartedAt || 0));
      }
      return token;
    },
    session: async ({ session, token }) => ({
      ...session,
      user: { ...session.user, id: token.sub!, role: token.role, invalid: Boolean(token.invalid) },
    }),
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" },
    },
  },
});
