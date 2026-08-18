import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { clubCodes } from "@/db/schema";

const schema = z.object({ status: z.enum(["ACTIVE", "DISABLED"]) });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if ((await auth())?.user.role !== "ADMIN") return Response.json({ message: "Non autorisé." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: "Statut invalide." }, { status: 400 });
  const { id } = await params;
  const code = await db.query.clubCodes.findFirst({ where: eq(clubCodes.id, id) });
  if (!code || code.status === "REDEEMED") return Response.json({ message: "Ce code utilisé ne peut plus être réactivé." }, { status: 400 });
  await db.update(clubCodes).set({ status: parsed.data.status }).where(eq(clubCodes.id, id));
  return Response.json({ message: parsed.data.status === "DISABLED" ? "Code désactivé." : "Code réactivé." });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if ((await auth())?.user.role !== "ADMIN") return Response.json({ message: "Non autorisé." }, { status: 401 });
  const { id } = await params;
  await db.delete(clubCodes).where(eq(clubCodes.id, id));
  return Response.json({ message: "Code et accès associé supprimés." });
}
