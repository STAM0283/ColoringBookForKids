import sharp from "sharp";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { activities, activityGallery, activityTypes, media } from "@/db/schema";
import { storageService } from "@/lib/storage/local-storage";
import { idList, replaceActivityCategories } from "@/lib/activity-relations";

const schema = z.object({
  title: z.string().trim().min(2).max(150).optional(),
  language: z.enum(["FR","EN"]).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  published: z.boolean().optional(),
  accessLevel: z.enum(["PUBLIC", "CLUB"]).optional(),
  downloadEnabled: z.boolean().optional(),
  activityTypeId: z.string().nullable().optional(),
}).refine(value => Object.values(value).some(item => item !== undefined));

async function admin(){return (await auth())?.user.role === "ADMIN";}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await admin()) return Response.json({ message: "Non autorisé." }, { status: 401 });
  const { id } = await params;
  const current = await db.query.activities.findFirst({ where: eq(activities.id, id) });
  if (!current) return Response.json({ message: "Activité introuvable." }, { status: 404 });
  const multipart = request.headers.get("content-type")?.includes("multipart/form-data");
  let values: unknown;
  let cover: File | null = null;
  let categoryIds: string[] | null = null;
  if (multipart) {
    const form = await request.formData();
    const selected = form.get("cover");
    cover = selected instanceof File && selected.size ? selected : null;
    categoryIds = idList(form.get("categoryIds"));
    values = { title: form.get("title"), description: form.get("description"), activityTypeId:String(form.get("activityTypeId")||"")||null, accessLevel: form.get("accessLevel"), published: form.get("published") === "true", downloadEnabled: form.get("downloadEnabled") === "true" };
  } else values = await request.json().catch(() => null);
  const parsed = schema.safeParse(values);
  if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message || "Données invalides." }, { status: 400 });
  if (parsed.data.activityTypeId) {
    const expectedLanguage = parsed.data.language || current.language;
    const [validType] = await db.select({ id: activityTypes.id }).from(activityTypes).where(and(eq(activityTypes.id, parsed.data.activityTypeId), eq(activityTypes.language, expectedLanguage))).limit(1);
    if (!validType) return Response.json({ message: "Le type d’activité ne correspond pas à la langue de l’activité." }, { status: 400 });
  }

  let previewMediaId = current.previewMediaId;
  let previousPreview: typeof media.$inferSelect | undefined;
  if (cover) {
    previousPreview = current.previewMediaId ? await db.query.media.findFirst({ where: eq(media.id, current.previewMediaId) }) : undefined;
    await storageService.validateFile(cover, "IMAGE");
    const meta = await sharp(Buffer.from(await cover.arrayBuffer())).metadata();
    const stored = await storageService.uploadFile(cover, "IMAGE");
    previewMediaId = crypto.randomUUID();
    await db.insert(media).values({ id: previewMediaId, type: "IMAGE", filename: stored.filename, originalName: cover.name, mimeType: stored.mimeType, size: stored.size, width: meta.width, height: meta.height, path: stored.path, alt: `Couverture de ${parsed.data.title || current.title}` });
  }
  await db.update(activities).set({ ...parsed.data, previewMediaId, ...(parsed.data.published !== undefined ? { publishedAt: parsed.data.published ? (current.publishedAt || new Date()) : null } : {}), updatedAt: new Date() }).where(eq(activities.id, id));
  if (categoryIds) await replaceActivityCategories(id, categoryIds);
  if (previousPreview) {
    const usedAsPage = await db.query.activityGallery.findFirst({ where: eq(activityGallery.mediaId, previousPreview.id) });
    if (!usedAsPage) { await db.delete(media).where(eq(media.id, previousPreview.id)); await storageService.deleteFile(previousPreview.path).catch(() => undefined); }
  }
  revalidateActivityPages();
  return Response.json({ message: "Activité modifiée avec succès." });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await admin()) return Response.json({ message: "Non autorisé." }, { status: 401 });
  const { id } = await params;
  const item = await db.query.activities.findFirst({ where: eq(activities.id, id) });
  if (!item) return Response.json({ message: "Activité introuvable." }, { status: 404 });
  const gallery = await db.select({mediaId:activityGallery.mediaId}).from(activityGallery).where(eq(activityGallery.activityId,id));
  const mediaIds = [...new Set([item.previewMediaId, item.pdfMediaId, ...gallery.map(page=>page.mediaId)].filter((value): value is string => Boolean(value)))];
  const linkedMedia = mediaIds.length ? await db.select().from(media).where(inArray(media.id, mediaIds)) : [];
  await db.delete(activities).where(eq(activities.id, id));
  if (mediaIds.length) await db.delete(media).where(inArray(media.id, mediaIds));
  await Promise.all(linkedMedia.map(item => storageService.deleteFile(item.path).catch(() => undefined)));
  revalidateActivityPages();
  return Response.json({ message: "Activité supprimée avec succès." });
}

function revalidateActivityPages() {
  revalidatePath("/");
  revalidatePath("/activites");
  revalidatePath("/en");
  revalidatePath("/en/activities");
}
