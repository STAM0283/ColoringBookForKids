import { auth } from "@/auth";
import { db } from "@/db";
import { siteVisits } from "@/db/schema";

export async function DELETE() {
  if ((await auth())?.user.role !== "ADMIN") return Response.json({ message: "Non autorisé." }, { status: 401 });
  const removed = await db.delete(siteVisits).returning({ id: siteVisits.id });
  return Response.json({ message: "Les statistiques de fréquentation ont été vidées.", removed: removed.length });
}
