import fs from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    const mediaRoot = path.resolve(/* turbopackIgnore: true */ process.env.MEDIA_ROOT ?? "./data/media");
    fs.accessSync(mediaRoot, fs.constants.R_OK | fs.constants.W_OK);
    return Response.json({ status: "ok", database: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "error" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
