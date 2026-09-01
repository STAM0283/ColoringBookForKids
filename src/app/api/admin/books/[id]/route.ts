import sharp from "sharp";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { books, media } from "@/db/schema";
import { storageService } from "@/lib/storage/local-storage";

const updateSchema = z.object({
  language: z.enum(["FR","EN"]),
  title: z.string().trim().min(2).max(150), shortDescription: z.string().trim().min(10).max(300), description: z.string().trim().min(10),
  categoryId: z.string().uuid().nullable(), ageMin: z.number().int().min(0).max(18), ageMax: z.number().int().min(0).max(18),
  pageCount: z.number().int().min(1).max(1000), amazonUrl: z.union([z.literal(""), z.string().url()]), pricingType: z.enum(["FREE", "PAID"]),
  priceCents: z.number().int().min(1).nullable(), published: z.boolean(), featured: z.boolean(),
}).refine(value => value.ageMax >= value.ageMin, { message: "L’âge maximum doit être supérieur à l’âge minimum." });

async function isAdmin() { return (await auth())?.user.role === "ADMIN"; }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) return Response.json({ message: "Non autorisé." }, { status: 401 });
  const { id } = await params, current = await db.query.books.findFirst({ where: eq(books.id, id) });
  if (!current) return Response.json({ message: "Livre introuvable." }, { status: 404 });
  const isMultipart = request.headers.get("content-type")?.includes("multipart/form-data");
  const form = isMultipart ? await request.formData() : null;
  const body = form ? {
    language: form.get("language") === "EN" ? "EN" : "FR", title: form.get("title"), shortDescription: form.get("shortDescription"), description: form.get("description"),
    categoryId: form.get("categoryId") || null, ageMin: Number(form.get("ageMin")), ageMax: Number(form.get("ageMax")),
    pageCount: Number(form.get("pageCount")), amazonUrl: form.get("amazonUrl") || "", pricingType: form.get("pricingType"),
    priceCents: form.get("pricingType") === "FREE" || !form.get("price") ? null : Math.round(Number(form.get("price")) * 100),
    published: form.get("published") === "true", featured: current.featured,
  } : await request.json();
  const parsed = updateSchema.safeParse({ ...body, language:body.language??current.language, featured: body.featured ?? current.featured });
  if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  const value = parsed.data, hasNewPrice = value.pricingType === "PAID" && value.priceCents && (value.priceCents !== current.priceCents || current.pricingType !== "PAID");
  let newCover: { id: string; path: string } | null = null;
  let newPdf: { id: string; path: string } | null = null;
  try {
    const cover = form?.get("cover");
    if (cover instanceof File && cover.size > 0) {
      await storageService.validateFile(cover, "IMAGE");
      const dimensions = await sharp(Buffer.from(await cover.arrayBuffer())).metadata();
      const stored = await storageService.uploadFile(cover, "IMAGE");
      newCover = { id: crypto.randomUUID(), path: stored.path };
      await db.insert(media).values({ ...newCover, type: "IMAGE", filename: stored.filename, originalName: cover.name, mimeType: stored.mimeType, size: stored.size, width: dimensions.width, height: dimensions.height, alt: `Couverture de ${value.title}` });
    }
    const pdf = form?.get("pdf");
    if (pdf instanceof File && pdf.size > 0) {
      if (value.pricingType !== "FREE") throw new Error("Un PDF peut uniquement être associé à un livre gratuit.");
      const stored = await storageService.uploadFile(pdf, "PDF");
      newPdf = { id: crypto.randomUUID(), path: stored.path };
      await db.insert(media).values({ ...newPdf, type: "PDF", filename: stored.filename, originalName: pdf.name, mimeType: stored.mimeType, size: stored.size });
    }
    const shouldRemovePdf = value.pricingType === "PAID" || form?.get("removePdf") === "true";
    await db.update(books).set({ ...value, coverMediaId: newCover?.id ?? current.coverMediaId, pdfMediaId: shouldRemovePdf ? null : (newPdf?.id ?? current.pdfMediaId), amazonUrl: value.amazonUrl || null, priceCents: value.pricingType === "PAID" ? value.priceCents : null, priceUpdatedAt: value.pricingType === "FREE" ? null : hasNewPrice ? new Date() : current.priceUpdatedAt, publishedAt: value.published ? (current.publishedAt ?? new Date()) : null, updatedAt: new Date() }).where(eq(books.id, id));
    if (newCover && current.coverMediaId) {
      const oldCover = await db.query.media.findFirst({ where: eq(media.id, current.coverMediaId) });
      if (oldCover) { await db.delete(media).where(eq(media.id, oldCover.id)); await storageService.deleteFile(oldCover.path).catch(() => undefined); }
    }
    if ((newPdf || shouldRemovePdf) && current.pdfMediaId) {
      const oldPdf = await db.query.media.findFirst({ where: eq(media.id, current.pdfMediaId) });
      if (oldPdf) { await db.delete(media).where(eq(media.id, oldPdf.id)); await storageService.deleteFile(oldPdf.path).catch(() => undefined); }
    }
  } catch (error) {
    if (newCover) { await db.delete(media).where(eq(media.id, newCover.id)).catch(() => undefined); await storageService.deleteFile(newCover.path).catch(() => undefined); }
    if (newPdf) { await db.delete(media).where(eq(media.id, newPdf.id)).catch(() => undefined); await storageService.deleteFile(newPdf.path).catch(() => undefined); }
    return Response.json({ message: error instanceof Error ? error.message : "Modification impossible." }, { status: 400 });
  }
  return Response.json({ message: "Livre modifié avec succès." });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) return Response.json({ message: "Non autorisé." }, { status: 401 });
  const { id } = await params, item = await db.query.books.findFirst({ where: eq(books.id, id) });
  if (!item) return Response.json({ message: "Livre introuvable." }, { status: 404 });
  const cover = item.coverMediaId ? await db.query.media.findFirst({ where: eq(media.id, item.coverMediaId) }) : null;
  const video = item.videoMediaId ? await db.query.media.findFirst({ where: eq(media.id, item.videoMediaId) }) : null;
  const pdf = item.pdfMediaId ? await db.query.media.findFirst({ where: eq(media.id, item.pdfMediaId) }) : null;
  await db.delete(books).where(eq(books.id, id));
  if (cover) { await db.delete(media).where(eq(media.id, cover.id)); await storageService.deleteFile(cover.path).catch(() => undefined); }
  if (video) { await db.delete(media).where(eq(media.id, video.id)); await storageService.deleteFile(video.path).catch(() => undefined); }
  if (pdf) { await db.delete(media).where(eq(media.id, pdf.id)); await storageService.deleteFile(pdf.path).catch(() => undefined); }
  return Response.json({ message: "Livre supprimé avec succès." });
}
