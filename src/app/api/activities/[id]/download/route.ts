import fs from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { activities, clubSessions, media } from "@/db/schema";
import { getClubSession } from "@/lib/club-access";

export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isAdmin = (await auth())?.user.role === "ADMIN";
  const [result] = await db.select({ activity: activities, pdf: media }).from(activities)
    .innerJoin(media, eq(activities.pdfMediaId, media.id))
    .where(eq(activities.id, id)).limit(1);
  if (!result || (!result.activity.published && !isAdmin)) return Response.json({ message: "Activité introuvable." }, { status: 404 });
  if (!result.activity.downloadEnabled && !isAdmin) return Response.json({ message: "Le téléchargement de cette activité est temporairement désactivé." }, { status: 403 });

  const clubSession = result.activity.accessLevel === "CLUB" && !isAdmin ? await getClubSession() : null;
  if (result.activity.accessLevel === "CLUB" && !isAdmin && !clubSession) return Response.json({ message: "Cette activité est réservée au Club.", code: "CLUB_REQUIRED" }, { status: 403 });

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
  return new Response(Readable.toWeb(fs.createReadStream(target)) as ReadableStream, { headers: { "Content-Type": "application/pdf", "Content-Length": String(fileStat.size), "Content-Disposition": `attachment; filename="${result.pdf.originalName.replaceAll('"', '')}"`, "Cache-Control": "private, no-store" } });
}
