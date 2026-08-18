import fs from "node:fs/promises";
import path from "node:path";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { databasePath, db, sqlite } from "@/db";
import { backups } from "@/db/schema";

export const runtime = "nodejs";
const backupRoot = path.resolve(/*turbopackIgnore: true*/ process.env.BACKUP_ROOT ?? "./data/backups");

async function createSafetyBackup() {
  await fs.mkdir(backupRoot, { recursive: true });
  const id = crypto.randomUUID();
  const filename = `site-${new Date().toISOString().replace(/[:.]/g, "-")}.db`;
  const destination = path.join(backupRoot, filename);
  await db.insert(backups).values({ id, filename, path: destination, size: 0, status: "RUNNING", kind: "MANUAL" });
  try {
    await sqlite.backup(destination);
    const size = (await fs.stat(destination)).size;
    await db.update(backups).set({ status: "SUCCESS", size, completedAt: new Date() }).where(eq(backups.id, id));
  } catch (error) {
    await db.update(backups).set({ status: "FAILED", error: error instanceof Error ? error.message : "Erreur inconnue", completedAt: new Date() }).where(eq(backups.id, id));
    throw error;
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return Response.json({ message: "Non autorisé." }, { status: 401 });
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) return Response.json({ message: "Fichier SQLite manquant." }, { status: 400 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size > 500 * 1024 * 1024) return Response.json({ message: "Fichier SQLite manquant ou trop volumineux." }, { status: 400 });
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.subarray(0, 16).toString("utf8") !== "SQLite format 3\0") return Response.json({ message: "Le fichier sélectionné n’est pas une base SQLite." }, { status: 400 });

  await fs.mkdir(backupRoot, { recursive: true });
  const temporary = path.join(backupRoot, `.restore-${crypto.randomUUID()}.db`);
  await fs.writeFile(temporary, buffer, { flag: "wx" });
  let source: Database.Database | undefined;
  try {
    source = new Database(temporary, { readonly: true, fileMustExist: true });
    if (source.pragma("integrity_check", { simple: true }) !== "ok") throw new Error("Contrôle d’intégrité SQLite échoué.");
    const required = source.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users','settings','books')").all() as { name: string }[];
    if (required.length !== 3) throw new Error("Cette sauvegarde ne correspond pas à l’application.");
    await createSafetyBackup();
    await source.backup(databasePath);
    return Response.json({ message: "Base restaurée. Actualisez l’application." });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Restauration impossible." }, { status: 400 });
  } finally {
    source?.close();
    await fs.unlink(temporary).catch(() => undefined);
  }
}
