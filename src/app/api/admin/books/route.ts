import sharp from "sharp";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { bookGallery, books, media } from "@/db/schema";
import { storageService } from "@/lib/storage/local-storage";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

const schema = z.object({
  language: z.enum(["FR", "EN"]),
  title: z.string().min(2).max(150),
  shortDescription: z.string().min(10).max(300),
  description: z.string().min(10).max(100000),
  ageMin: z.coerce.number().int().min(0).max(18),
  ageMax: z.coerce.number().int().min(0).max(18),
  pageCount: z.coerce.number().int().min(1).max(1000),
  amazonUrl: z.union([z.literal(""), z.string().url()]),
  categoryId: z.string().uuid().nullable(),
  pricingType: z.enum(["FREE", "PAID"]),
  priceCents: z.number().int().min(1).nullable(),
  featured: z.boolean(),
  published: z.boolean(),
}).refine(value => value.ageMax >= value.ageMin, { message: "L’âge maximum doit être supérieur à l’âge minimum." });

export async function GET() {
  if ((await auth())?.user.role !== "ADMIN") return Response.json({ message: "Non autorisé." }, { status: 401 });
  try {
    const items = await db.select({ book: books, cover: media }).from(books)
      .leftJoin(media, eq(books.coverMediaId, media.id)).orderBy(desc(books.updatedAt));
    return Response.json({ items });
  } catch (error) {
    console.error("Impossible de charger les livres", error);
    return Response.json({ message: "La liste des livres ne peut pas être chargée. Vérifiez que les migrations sont appliquées." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if ((await auth())?.user.role !== "ADMIN") return Response.json({ message: "Non autorisé." }, { status: 401 });
  const form = await request.formData();
  const cover = form.get("cover");
  const video = form.get("video");
  const galleryFiles = form.getAll("gallery").filter((value): value is File => value instanceof File && value.size > 0);
  if (galleryFiles.length > 12) return Response.json({ message: "La galerie est limitée à 12 images." }, { status: 400 });
  const parsed = schema.safeParse({
    language: form.get("language") === "EN" ? "EN" : "FR", title: form.get("title"), shortDescription: form.get("shortDescription"), description: form.get("description"),
    ageMin: form.get("ageMin"), ageMax: form.get("ageMax"), pageCount: form.get("pageCount"), amazonUrl: form.get("amazonUrl") || "",
    categoryId: form.get("categoryId") || null, pricingType: form.get("pricingType") === "FREE" ? "FREE" : "PAID",
    priceCents: form.get("pricingType") === "FREE" || !form.get("price") ? null : Math.round(Number(form.get("price")) * 100),
    featured: form.get("featured") === "on", published: form.get("published") === "on",
  });
  if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message }, { status: 400 });

  try {
    let coverMediaId: string | null = null;
    if (cover instanceof File && cover.size) {
      await storageService.validateFile(cover, "IMAGE");
      const meta = await sharp(Buffer.from(await cover.arrayBuffer())).metadata();
      const stored = await storageService.uploadFile(cover, "IMAGE");
      coverMediaId = crypto.randomUUID();
      await db.insert(media).values({ id: coverMediaId, type: "IMAGE", filename: stored.filename, originalName: cover.name, mimeType: stored.mimeType, size: stored.size, width: meta.width, height: meta.height, path: stored.path, alt: `Couverture de ${parsed.data.title}` });
    }

    let videoMediaId: string | null = null;
    if (video instanceof File && video.size) {
      const stored = await storageService.uploadFile(video, "VIDEO");
      videoMediaId = crypto.randomUUID();
      await db.insert(media).values({ id: videoMediaId, type: "VIDEO", filename: stored.filename, originalName: video.name, mimeType: stored.mimeType, size: stored.size, path: stored.path });
    }

    const id = crypto.randomUUID();
    const slug = `${slugify(parsed.data.title)}-${id.slice(0, 6)}`;
    await db.insert(books).values({ id, slug, language:parsed.data.language, title: parsed.data.title, shortDescription: parsed.data.shortDescription, description: parsed.data.description, categoryId: parsed.data.categoryId, ageMin: parsed.data.ageMin, ageMax: parsed.data.ageMax, pageCount: parsed.data.pageCount, amazonUrl: parsed.data.amazonUrl || null, pricingType: parsed.data.pricingType, priceCents: parsed.data.pricingType === "PAID" ? parsed.data.priceCents : null, priceUpdatedAt: parsed.data.pricingType === "PAID" && parsed.data.priceCents ? new Date() : null, featured: parsed.data.featured, published: parsed.data.published, coverMediaId, videoMediaId, publishedAt: parsed.data.published ? new Date() : null });

    for (const [sortOrder, image] of galleryFiles.entries()) {
      await storageService.validateFile(image, "IMAGE");
      const meta = await sharp(Buffer.from(await image.arrayBuffer())).metadata();
      const stored = await storageService.uploadFile(image, "IMAGE");
      const mediaId = crypto.randomUUID();
      await db.insert(media).values({ id: mediaId, type: "IMAGE", filename: stored.filename, originalName: image.name, mimeType: stored.mimeType, size: stored.size, width: meta.width, height: meta.height, path: stored.path, alt: `Image de ${parsed.data.title}` });
      await db.insert(bookGallery).values({ id: crypto.randomUUID(), bookId: id, mediaId, sortOrder });
    }

    return Response.json({ id, slug, message: galleryFiles.length ? `Livre créé avec ${galleryFiles.length} image${galleryFiles.length > 1 ? "s" : ""} dans sa galerie.` : "Livre créé avec succès." }, { status: 201 });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Création impossible." }, { status: 400 });
  }
}
