import fs from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { activities, media } from "@/db/schema";
import { hasClubAccess } from "@/lib/club-access";

export const runtime = "nodejs";
const mime: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif", ".pdf": "application/pdf", ".mp4": "video/mp4" };

export async function GET(request: Request, { params }: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await params;
  const root = path.resolve(/*turbopackIgnore: true*/ process.env.MEDIA_ROOT ?? "./data/media");
  const target = path.resolve(root, ...segments);
  if (!target.startsWith(root + path.sep)) return new Response("Introuvable", { status: 404 });

  let fileStat;
  try {
    fileStat = await stat(target);
    if (!fileStat.isFile()) throw new Error("Not a file");
  } catch {
    return new Response("Introuvable", { status: 404 });
  }

  const relativePath = segments.join("/");
  let protectedPdf = false;
  if (path.extname(target).toLowerCase() === ".pdf") {
    const [protectedActivity] = await db.select({ id: activities.id }).from(activities).innerJoin(media, eq(activities.pdfMediaId, media.id))
      .where(and(eq(media.path, relativePath), eq(activities.accessLevel, "CLUB"))).limit(1);
    protectedPdf = Boolean(protectedActivity);
    if (protectedActivity && !await hasClubAccess()) return new Response("Accès Club requis", { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const type = mime[path.extname(target).toLowerCase()] ?? "application/octet-stream";
  const forceDownload = new URL(request.url).searchParams.get("download") === "1";
  const range = request.headers.get("range");
  const commonHeaders = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": protectedPdf ? "private, no-store" : "public, max-age=31536000, immutable", ...(forceDownload ? { "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(path.basename(target))}` } : {}) };
  if (!range) return new Response(Readable.toWeb(fs.createReadStream(target)) as ReadableStream, { headers: { ...commonHeaders, "Content-Length": String(fileStat.size) } });

  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${fileStat.size}` } });
  const suffixLength = !match[1] && match[2] ? Number(match[2]) : null;
  const start = suffixLength === null ? Number(match[1]) : Math.max(0, fileStat.size - suffixLength);
  const end = suffixLength === null && match[2] ? Math.min(Number(match[2]), fileStat.size - 1) : fileStat.size - 1;
  if (suffixLength === 0 || start > end || start >= fileStat.size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${fileStat.size}` } });
  return new Response(Readable.toWeb(fs.createReadStream(target, { start, end })) as ReadableStream, { status: 206, headers: { ...commonHeaders, "Content-Length": String(end - start + 1), "Content-Range": `bytes ${start}-${end}/${fileStat.size}` } });
}
