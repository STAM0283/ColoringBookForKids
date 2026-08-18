import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { writeSecurityLog } from "@/lib/security";

const schema = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: z.string().min(12, "Le nouveau mot de passe doit contenir au moins 12 caractères.").max(128)
    .regex(/[a-z]/, "Ajoutez une lettre minuscule.")
    .regex(/[A-Z]/, "Ajoutez une lettre majuscule.")
    .regex(/[0-9]/, "Ajoutez un chiffre.")
    .regex(/[^A-Za-z0-9]/, "Ajoutez un caractère spécial."),
}).refine(value => value.currentPassword !== value.newPassword, { message: "Choisissez un mot de passe différent.", path: ["newPassword"] });

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN" || !session.user.id) return Response.json({ message: "Non autorisé." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message }, { status: 400 });

  const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
  if (!user || !await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)) {
    return Response.json({ message: "Le mot de passe actuel est incorrect." }, { status: 400 });
  }

  const now = new Date();
  await db.update(users).set({ passwordHash: await bcrypt.hash(parsed.data.newPassword, 12), passwordChangedAt: now, failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.id, user.id));
  await writeSecurityLog("PASSWORD_CHANGED", request.headers, { userId: user.id });
  return Response.json({ message: "Mot de passe modifié. Vous allez être déconnecté de tous les appareils." });
}
