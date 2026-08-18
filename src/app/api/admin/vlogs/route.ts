import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import sharp from "sharp";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { media, vlogs } from "@/db/schema";
import { storageService } from "@/lib/storage/local-storage";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

const schema = z.object({
  title: z.string().min(2).max(150),
  description: z.string().min(10).max(2000),
  duration: z.coerce.number().int().min(0).max(86400),
  featured: z.boolean(),
  published: z.boolean(),
  categoryId: z.string().uuid().nullable(),
});

export async function GET() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return Response.json({ message: "Non autorisé." }, { status: 401 });

  const video = alias(media, "video_media");
  const thumbnail = alias(media, "thumbnail_media");
  const items = await db
    .select({ item: vlogs, video, thumbnail })
    .from(vlogs)
    .leftJoin(video, eq(vlogs.videoMediaId, video.id))
    .leftJoin(thumbnail, eq(vlogs.thumbnailMediaId, thumbnail.id))
    .orderBy(desc(vlogs.updatedAt))
    .limit(100);

  return Response.json({ items });
}

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return Response.json({ message: "Non autorisé." }, { status: 401 });

  const form = await request.formData();
  const video = form.get("video");
  const thumbnail = form.get("thumbnail");
  const parsed = schema.safeParse({
    title: form.get("title"),
    description: form.get("description"),
    duration: form.get("duration") || 0,
    featured: form.get("featured") === "on",
    published: form.get("published") === "on",
    categoryId: String(form.get("categoryId") || "") || null,
  });
  if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  if (!(video instanceof File) || !video.size) return Response.json({ message: "La vidéo MP4 est obligatoire." }, { status: 400 });

  try {
    const storedVideo = await storageService.uploadFile(video, "VIDEO");
    const videoId = crypto.randomUUID();
    await db.insert(media).values({ id: videoId, type: "VIDEO", filename: storedVideo.filename, originalName: video.name, mimeType: storedVideo.mimeType, size: storedVideo.size, path: storedVideo.path, duration: parsed.data.duration });

    let thumbnailId: string | null = null;
    if (thumbnail instanceof File && thumbnail.size) {
      await storageService.validateFile(thumbnail, "IMAGE");
      const metadata = await sharp(Buffer.from(await thumbnail.arrayBuffer())).metadata();
      const stored = await storageService.uploadFile(thumbnail, "IMAGE");
      thumbnailId = crypto.randomUUID();
      await db.insert(media).values({ id: thumbnailId, type: "IMAGE", filename: stored.filename, originalName: thumbnail.name, mimeType: stored.mimeType, size: stored.size, width: metadata.width, height: metadata.height, path: stored.path, alt: `Miniature de ${parsed.data.title}` });
    }

    const id = crypto.randomUUID();
    const slug = `${slugify(parsed.data.title)}-${id.slice(0, 6)}`;
    await db.insert(vlogs).values({ id, slug, title: parsed.data.title, description: parsed.data.description, categoryId: parsed.data.categoryId, duration: parsed.data.duration, featured: parsed.data.featured, published: parsed.data.published, videoMediaId: videoId, thumbnailMediaId: thumbnailId, publishedAt: parsed.data.published ? new Date() : null });
    return Response.json({ id, slug }, { status: 201 });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Création impossible." }, { status: 400 });
  }
}
