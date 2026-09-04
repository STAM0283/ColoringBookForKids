import fs from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { auth } from "@/auth";
import { db } from "@/db";
import { activities, activityGallery, clubSessions, media } from "@/db/schema";
import { hasContentAccess } from "@/lib/content-access";
import { getClubSession } from "@/lib/club-access";
import { imagesWithModelsToPdf } from "@/lib/images-to-pdf";

export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isAdmin = (await auth())?.user.role === "ADMIN";
  const [result] = await db.select({ activity: activities, pdf: media }).from(activities)
    .innerJoin(media, eq(activities.pdfMediaId, media.id))
    .where(eq(activities.id, id)).limit(1);
  if (!result || (!result.activity.published && !isAdmin)) return Response.json({ message: "Activité introuvable." }, { status: 404 });
  if (!result.activity.downloadEnabled && !isAdmin) return Response.json({ message: "Le téléchargement de cette activité est temporairement désactivé." }, { status: 403 });

  const clubSession = result.activity.accessLevel === "CLUB" && !isAdmin ? await getClubSession() : null;
  if (!isAdmin && !await hasContentAccess(result.activity.accessLevel, result.activity.accessBookId)) return Response.json({ message: "Un code parent est nécessaire pour ce PDF.", code: "ACCESS_REQUIRED" }, { status: 403 });

  const root = path.resolve(/*turbopackIgnore: true*/ process.env.MEDIA_ROOT ?? "./data/media");
  const target = path.resolve(root, result.pdf.path);
  if (!target.startsWith(root + path.sep)) return Response.json({ message: "PDF introuvable." }, { status: 404 });
  let fileStat;
  try {
    fileStat = await stat(target);
    if (!fileStat.isFile()) throw new Error("Not a file");
  } catch {
    return Response.json({ message: "PDF introuvable." }, { status: 404 });
  }
  await db.update(activities).set({ downloadCount: sql`${activities.downloadCount} + 1` }).where(eq(activities.id, id));
  if (clubSession) await db.update(clubSessions).set({ downloadCount: sql`${clubSessions.downloadCount} + 1`, lastUsedAt: new Date() }).where(eq(clubSessions.id, clubSession.id));
  const includeModel = new URL(request.url).searchParams.get("model") === "1";
  const print = new URL(request.url).searchParams.get("print") === "1";
  if (includeModel) {
    const modelMedia=alias(media,"download_page_model");
    const pages=await db.select({path:media.path,modelPath:modelMedia.path}).from(activityGallery).innerJoin(media,eq(activityGallery.mediaId,media.id)).leftJoin(modelMedia,eq(activityGallery.modelMediaId,modelMedia.id)).where(eq(activityGallery.activityId,id)).orderBy(activityGallery.sortOrder);
    if (pages.some(page=>Boolean(page.modelPath))) {
      try {
        const entries=await Promise.all(pages.map(async page=>({page:await readFile(safeMediaPath(root,page.path)),model:page.modelPath?await readFile(safeMediaPath(root,page.modelPath)):null})));
        const pdf = await imagesWithModelsToPdf(entries);
        const filename = result.pdf.originalName.replace(/\.pdf$/i, "-avec-modele.pdf").replaceAll('"', "");
        return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Length": String(pdf.length), "Content-Disposition": `${print?"inline":"attachment"}; filename="${filename}"`, "Cache-Control": "private, no-store" } });
      } catch { return Response.json({ message: "Impossible de générer le PDF avec modèle." }, { status: 500 }); }
    }
  }
  return new Response(Readable.toWeb(fs.createReadStream(target)) as ReadableStream, { headers: { "Content-Type": "application/pdf", "Content-Length": String(fileStat.size), "Content-Disposition": `${print?"inline":"attachment"}; filename="${result.pdf.originalName.replaceAll('"', '')}"`, "Cache-Control": "private, no-store" } });
}

function safeMediaPath(root:string,relative:string){const target=path.resolve(root,relative);if(!target.startsWith(root+path.sep))throw new Error("Chemin de média invalide");return target;}
