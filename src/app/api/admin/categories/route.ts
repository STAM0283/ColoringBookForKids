import { asc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories } from "@/db/schema";

// Catalogue partagé en lecture seule pour les formulaires qui peuvent
// réutiliser une catégorie existante, quelle que soit sa section d’origine.
export async function GET() {
  if ((await auth())?.user.role !== "ADMIN") return Response.json({ message: "Non autorisé." }, { status: 401 });
  const items = await db.select().from(categories).orderBy(asc(categories.language), asc(categories.sortOrder), asc(categories.name));
  return Response.json({ items });
}
