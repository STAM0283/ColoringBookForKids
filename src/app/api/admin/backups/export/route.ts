import fs from "node:fs/promises";
import path from "node:path";
import { auth } from "@/auth";
import { sqlite } from "@/db";

export const runtime = "nodejs";
export async function GET() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return Response.json({ message: "Non autorisé." }, { status: 401 });
  const root = path.resolve(/*turbopackIgnore: true*/ process.env.BACKUP_ROOT ?? "./data/backups");
  await fs.mkdir(root, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `export-site-${stamp}.db`, temporary = path.join(root, `.export-${crypto.randomUUID()}.db`);
  try {
    await sqlite.backup(temporary);
    const buffer = await fs.readFile(temporary);
    return new Response(buffer, { headers: { "Content-Type": "application/vnd.sqlite3", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" } });
  } finally { await fs.unlink(temporary).catch(() => undefined); }
}
