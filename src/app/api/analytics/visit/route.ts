import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { siteVisits } from "@/db/schema";
import { getAuthSecret } from "@/lib/server-env";

export const runtime = "nodejs";
const cookieName = "petits_crayons_visitor";

function parisDay() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export async function POST() {
  const userAgent = (await headers()).get("user-agent") || "";
  if (/bot|crawler|spider|preview|lighthouse|headless/i.test(userAgent)) return new Response(null, { status: 204 });
  const store = await cookies();
  let visitorId = store.get(cookieName)?.value;
  const isNew = !visitorId;
  if (!visitorId) visitorId = crypto.randomUUID();
  const day = parisDay();
  const visitorHash = crypto.createHash("sha256").update(`${getAuthSecret()}:${visitorId}`).digest("hex");
  const id = crypto.createHash("sha256").update(`${visitorHash}:${day}`).digest("hex");
  const now = new Date();
  await db.insert(siteVisits).values({ id, visitorHash, visitedOn: day, firstSeenAt: now, lastSeenAt: now }).onConflictDoUpdate({ target: siteVisits.id, set: { lastSeenAt: now, pageViews: sql`${siteVisits.pageViews} + 1` } });
  if (isNew) store.set(cookieName, visitorId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  return new Response(null, { status: 204 });
}
