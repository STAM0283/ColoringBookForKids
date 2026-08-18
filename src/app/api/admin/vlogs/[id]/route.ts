import { eq, inArray } from "drizzle-orm";
import sharp from "sharp";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { media, vlogs } from "@/db/schema";
import { storageService } from "@/lib/storage/local-storage";

export const runtime = "nodejs";
const updateSchema = z.object({ title: z.string().min(2).max(150), description: z.string().min(10).max(2000), categoryId: z.string().uuid().nullable(), published: z.boolean() });
async function admin() { return (await auth())?.user.role === "ADMIN"; }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await admin()) return Response.json({ message: "Non autorisé." }, { status: 401 });
  const form = await request.formData();
  const parsed = updateSchema.safeParse({ title: form.get("title"), description: form.get("description"), categoryId: String(form.get("categoryId") || "") || null, published: form.get("published") === "true" });
  if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  const { id } = await params;
  const current = await db.query.vlogs.findFirst({ where: eq(vlogs.id, id) });
  if (!current) return Response.json({ message: "Vidéo introuvable." }, { status: 404 });

  const thumbnail = form.get("thumbnail");
  let createdMedia: typeof media.$inferSelect | null = null;
  try {
    let thumbnailMediaId = current.thumbnailMediaId;
    if (thumbnail instanceof File && thumbnail.size) {
      await storageService.validateFile(thumbnail, "IMAGE");
      const metadata = await sharp(Buffer.from(await thumbnail.arrayBuffer())).metadata();
      const stored = await storageService.uploadFile(thumbnail, "IMAGE");
      createdMedia = { id: crypto.randomUUID(), type: "IMAGE", filename: stored.filename, originalName: thumbnail.name, mimeType: stored.mimeType, size: stored.size, width: metadata.width ?? null, height: metadata.height ?? null, duration: null, path: stored.path, alt: `Miniature de ${parsed.data.title}`, createdAt: new Date(), updatedAt: new Date() };
      await db.insert(media).values(createdMedia);
      thumbnailMediaId = createdMedia.id;
    }

    await db.update(vlogs).set({ ...parsed.data, thumbnailMediaId, publishedAt: parsed.data.published ? (current.publishedAt ?? new Date()) : null, updatedAt: new Date() }).where(eq(vlogs.id, id));

    if (createdMedia && current.thumbnailMediaId) {
      const previous = await db.query.media.findFirst({ where: eq(media.id, current.thumbnailMediaId) });
      await db.delete(media).where(eq(media.id, current.thumbnailMediaId));
      if (previous) await storageService.deleteFile(previous.path).catch(() => undefined);
    }
    return Response.json({ message: createdMedia ? "Vidéo et miniature modifiées." : "Vidéo modifiée." });
  } catch (error) {
    if (createdMedia) {
      await db.delete(media).where(eq(media.id, createdMedia.id)).catch(() => undefined);
      await storageService.deleteFile(createdMedia.path).catch(() => undefined);
    }
    return Response.json({ message: error instanceof Error ? error.message : "Modification impossible." }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await admin()) return Response.json({ message: "Non autorisé." }, { status: 401 });
  const { id } = await params;
  const item = await db.query.vlogs.findFirst({ where: eq(vlogs.id, id) });
  if (!item) return Response.json({ message: "Vidéo introuvable." }, { status: 404 });
  const mediaIds = [item.videoMediaId, item.thumbnailMediaId].filter((value): value is string => Boolean(value));
  const linkedMedia = mediaIds.length ? await db.select().from(media).where(inArray(media.id, mediaIds)) : [];
  await db.delete(vlogs).where(eq(vlogs.id, id));
  if (mediaIds.length) await db.delete(media).where(inArray(media.id, mediaIds));
  await Promise.all(linkedMedia.map(item => storageService.deleteFile(item.path).catch(() => undefined)));
  return Response.json({ message: "Vidéo supprimée." });
}
