import { auth } from "@/auth";
import { db } from "@/db";
import { activities, media } from "@/db/schema";
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
  const title = String(form.get("title") || "document").trim();
  const description = String(form.get("description") || `Activité gratuite à imprimer : ${title}.`).trim();
  const accessLevel = form.get("accessLevel") === "CLUB" ? "CLUB" : "PUBLIC";
  const language = form.get("language") === "EN" ? "EN" : "FR";
  if (!images.length) return Response.json({ message: "Sélectionnez au moins une image." }, { status: 400 });
  if (images.length > 30) return Response.json({ message: "Le document est limité à 30 images." }, { status: 400 });
  try {
    const pdf = await imagesToPdf(images);
    const filename = `${slugify(title) || "document"}.pdf`;
    const file = new File([new Uint8Array(pdf)], filename, { type: "application/pdf" });
    const stored = await storageService.uploadFile(file, "PDF");
    const previewFile = cover || images[0];
    const previewStored = await storageService.uploadFile(previewFile, "IMAGE");
    const mediaId = crypto.randomUUID(), previewMediaId = crypto.randomUUID(), activityId = crypto.randomUUID();
    await db.insert(media).values({ id: mediaId, type: "PDF", filename: stored.filename, originalName: filename, mimeType: "application/pdf", size: stored.size, path: stored.path, alt: title });
    await db.insert(media).values({ id: previewMediaId, type: "IMAGE", filename: previewStored.filename, originalName: previewFile.name, mimeType: previewStored.mimeType, size: previewStored.size, path: previewStored.path, alt: `Couverture de ${title}` });
    await db.insert(activities).values({ id: activityId, language, title, slug: `${slugify(title) || "activite"}-${activityId.slice(0, 6)}`, description, previewMediaId, pdfMediaId: mediaId, pageCount: images.length, accessLevel, published: true, publishedAt: new Date() });
    await replaceActivityCategories(activityId, idList(form.get("categoryIds")));
    return Response.json({ message: accessLevel === "CLUB" ? "PDF créé et réservé au Club Instagram." : "PDF créé et publié dans les activités gratuites.", id: activityId, filename }, { status: 201 });
  } catch (error) { return Response.json({ message: error instanceof Error ? error.message : "Conversion impossible." }, { status: 400 }); }
}
