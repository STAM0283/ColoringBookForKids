import { and, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { activities, bookGallery, books, characters, media, mediaCategories, mediaCharacters, posts, vlogs } from "@/db/schema";
import { storageService } from "@/lib/storage/local-storage";

export const runtime = "nodejs";
async function admin() { return (await auth())?.user.role === "ADMIN"; }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await admin()) return Response.json({ message: "Non autorisé." }, { status: 401 });
  const parsed = z.object({ alt: z.string().max(300), creativeIdea:z.string().max(2000).optional(), categoryId: z.string().nullable().optional(), characterIds:z.array(z.string().uuid()).optional(), published: z.boolean(), accessLevel: z.enum(["PUBLIC", "CLUB"]) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: "Paramètres de l’image invalides." }, { status: 400 });
  const { id } = await params;
  const [item] = await db.select({ id: media.id, language:media.language }).from(media).where(and(eq(media.id, id), eq(media.galleryEnabled, true))).limit(1);
  if (!item) return Response.json({ message: "Image de galerie introuvable." }, { status: 404 });
  if(parsed.data.characterIds?.length){const ids=[...new Set(parsed.data.characterIds)],valid=await db.select({id:characters.id}).from(characters).where(and(inArray(characters.id,ids),eq(characters.language,item.language)));if(valid.length!==ids.length)return Response.json({message:"Un personnage sélectionné est invalide pour cette langue."},{status:400})}
  await db.transaction(async tx=>{await tx.update(media).set({ alt: parsed.data.alt.trim() || null, creativeIdea:parsed.data.creativeIdea===undefined?undefined:parsed.data.creativeIdea.trim()||null, published: parsed.data.published, accessLevel: parsed.data.accessLevel, updatedAt: new Date() }).where(eq(media.id, id));if(parsed.data.categoryId!==undefined){await tx.delete(mediaCategories).where(eq(mediaCategories.mediaId,id));if(parsed.data.categoryId)await tx.insert(mediaCategories).values({mediaId:id,categoryId:parsed.data.categoryId})}if(parsed.data.characterIds!==undefined){await tx.delete(mediaCharacters).where(eq(mediaCharacters.mediaId,id));if(parsed.data.characterIds.length)await tx.insert(mediaCharacters).values([...new Set(parsed.data.characterIds)].map(characterId=>({mediaId:id,characterId})))}})
  return Response.json({ message: "Image modifiée." });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await admin()) return Response.json({ message: "Non autorisé." }, { status: 401 });
  const { id } = await params;
  const item = await db.query.media.findFirst({ where: and(eq(media.id, id), eq(media.galleryEnabled, true)) });
  if (!item) return Response.json({ message: "Image de galerie introuvable." }, { status: 404 });
  const references = await Promise.all([
    db.query.books.findFirst({ where: or(eq(books.coverMediaId, id), eq(books.videoMediaId, id), eq(books.ogImageMediaId, id)) }),
    db.query.activities.findFirst({ where: or(eq(activities.previewMediaId, id), eq(activities.pdfMediaId, id)) }),
    db.query.posts.findFirst({ where: eq(posts.coverMediaId, id) }),
    db.query.vlogs.findFirst({ where: or(eq(vlogs.videoMediaId, id), eq(vlogs.thumbnailMediaId, id)) }),
    db.query.bookGallery.findFirst({ where: eq(bookGallery.mediaId, id) }),
  ]);
  if (references.some(Boolean)) return Response.json({ message: "Ce média est utilisé par un contenu. Modifiez d’abord ce contenu." }, { status: 409 });
  await db.delete(media).where(eq(media.id, id));
  await storageService.deleteFile(item.path).catch(() => undefined);
  return Response.json({ message: "Média supprimé." });
}
