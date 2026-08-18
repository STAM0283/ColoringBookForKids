import { desc, eq, isNull, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { recoveryCodes, securityLogs, users } from "@/db/schema";

export async function GET() {
  const session = await auth();
  if (session?.user.role !== "ADMIN" || !session.user.id) return Response.json({ message: "Non autorisé." }, { status: 401 });

  const [user, logs, recoveryCount] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, session.user.id), columns: { email: true, lockedUntil: true } }),
    db.select().from(securityLogs).orderBy(desc(securityLogs.createdAt)).limit(100),
    db.select({ count: sql<number>`count(*)` }).from(recoveryCodes).where(isNull(recoveryCodes.usedAt)),
  ]);
  return Response.json({ user, logs, unusedRecoveryCodes: Number(recoveryCount[0]?.count || 0) });
}
