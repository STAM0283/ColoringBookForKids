import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { slugify } from "@/lib/utils";

const colorPattern = /^#[0-9A-F]{6}$/i;
async function admin() { return (await auth())?.user.role === "ADMIN"; }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await admin()) return Response.json({ message: "Non autorisé." }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => null) as { name?: string; description?: string; color?: string; badge?: string } | null;
  const name = body?.name?.trim(), color = body?.color?.toUpperCase(), badge = body?.badge?.trim();
  if (!name || name.length < 2 || name.length > 60 || !color || !colorPattern.test(color) || !badge || badge.length > 12) return Response.json({ message: "Données invalides." }, { status: 400 });
  await db.update(categories).set({ name, slug: slugify(name), description: body?.description?.trim() || null, color, badge, updatedAt: new Date() }).where(and(eq(categories.id, id), eq(categories.scope, "BLOG")));
  return Response.json({ message: "Catégorie du blog modifiée avec succès." });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await admin()) return Response.json({ message: "Non autorisé." }, { status: 401 });
  const { id } = await params;
  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.scope, "BLOG")));
  return Response.json({ message: "Catégorie du blog supprimée avec succès." });
}
