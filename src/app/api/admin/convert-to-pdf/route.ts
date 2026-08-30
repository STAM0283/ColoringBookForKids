import { auth } from "@/auth";
import { db } from "@/db";
import { activities, activityGallery, activityTypes, media } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { imagesToPdf } from "@/lib/images-to-pdf";
import { storageService } from "@/lib/storage/local-storage";
import { slugify } from "@/lib/utils";
import { idList, replaceActivityCategories } from "@/lib/activity-relations";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if ((await auth())?.user.role !== "ADMIN") return Response.json({ message: "Non autorisé." }, { status: 401 });
  const form = await request.formData();
  const images = form.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);
  const requestedCover = form.get("cover");
  const cover = requestedCover instanceof File && requestedCover.size > 0 ? requestedCover : null;
  const title = String(form.get("title") || "").trim();
  const description = String(form.get("description") || "").trim();
  const accessLevel = form.get("accessLevel") === "CLUB" ? "CLUB" : "PUBLIC";
  const language = form.get("language") === "EN" ? "EN" : "FR";
  const activityTypeId = String(form.get("activityTypeId") || "") || null;
  if (title.length < 2 || title.length > 150) return Response.json({ message: "Le titre doit contenir entre 2 et 150 caractères." }, { status: 400 });
  if (description.length < 10 || description.length > 2000) return Response.json({ message: "La description doit contenir entre 10 et 2 000 caractères." }, { status: 400 });
  if (!images.length) return Response.json({ message: "Sélectionnez au moins une image." }, { status: 400 });
  if (images.length > 30) return Response.json({ message: "Le document est limité à 30 images." }, { status: 400 });
  if (activityTypeId) {
    const [validType] = await db.select({ id: activityTypes.id }).from(activityTypes).where(and(eq(activityTypes.id, activityTypeId), eq(activityTypes.language, language))).limit(1);
    if (!validType) return Response.json({ message: "Le type d’activité ne correspond pas à la langue sélectionnée." }, { status: 400 });
  }
  try {
    const pdf = await imagesToPdf(images);
    const filename = `${slugify(title) || "document"}.pdf`;
    const file = new File([new Uint8Array(pdf)], filename, { type: "application/pdf" });
    const stored = await storageService.uploadFile(file, "PDF");
    const mediaId = crypto.randomUUID(), activityId = crypto.randomUUID();
    await db.insert(media).values({ id: mediaId, type: "PDF", filename: stored.filename, originalName: filename, mimeType: "application/pdf", size: stored.size, path: stored.path, alt: title });
    const pages: Array<{ id: string; path: string }> = [];
    for (const [index, image] of images.entries()) {
      const page = await storageService.uploadFile(image, "IMAGE"), id = crypto.randomUUID();
      await db.insert(media).values({ id, type: "IMAGE", filename: page.filename, originalName: image.name, mimeType: page.mimeType, size: page.size, path: page.path, alt: `Page ${index + 1} de ${title}`, language });
      pages.push({ id, path: page.path });
    }
    let previewMediaId = pages[0].id;
    if (cover) {
      const previewStored = await storageService.uploadFile(cover, "IMAGE");
      previewMediaId = crypto.randomUUID();
      await db.insert(media).values({ id: previewMediaId, type: "IMAGE", filename: previewStored.filename, originalName: cover.name, mimeType: previewStored.mimeType, size: previewStored.size, path: previewStored.path, alt: `Couverture de ${title}`, language });
    }
    await db.insert(activities).values({ id: activityId, language, title, slug: `${slugify(title) || "activite"}-${activityId.slice(0, 6)}`, description, activityTypeId, previewMediaId, pdfMediaId: mediaId, pageCount: images.length, accessLevel, published: true, publishedAt: new Date() });
    await db.insert(activityGallery).values(pages.map((page, sortOrder) => ({ id: crypto.randomUUID(), activityId, mediaId: page.id, sortOrder })));
    await replaceActivityCategories(activityId, idList(form.get("categoryIds")));
    revalidatePath("/");
    revalidatePath("/activites");
    revalidatePath("/en");
    revalidatePath("/en/activities");
    return Response.json({ message: accessLevel === "CLUB" ? "PDF créé et réservé au Club Instagram." : "PDF créé et publié dans les activités gratuites.", id: activityId, filename }, { status: 201 });
  } catch (error) { return Response.json({ message: error instanceof Error ? error.message : "Conversion impossible." }, { status: 400 }); }
}
