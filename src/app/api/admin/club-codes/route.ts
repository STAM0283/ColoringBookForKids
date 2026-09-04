import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { books, clubCodes, clubSessions } from "@/db/schema";
import { clubCodeHint, generateClubCode, hashClubValue, normalizeClubCode } from "@/lib/club-access";

export async function GET() {
  if ((await auth())?.user.role !== "ADMIN") return Response.json({ message: "Non autorisé." }, { status: 401 });
  const items = await db.select({ code: clubCodes, bookTitle: books.title, downloads: sql<number>`coalesce(sum(${clubSessions.downloadCount}), 0)` }).from(clubCodes)
    .leftJoin(clubSessions, eq(clubSessions.accessCodeId, clubCodes.id)).leftJoin(books, eq(clubCodes.bookId, books.id)).groupBy(clubCodes.id, books.title).orderBy(desc(clubCodes.createdAt)).limit(250);
  return Response.json({ items });
}

const createSchema = z.object({ bookId: z.string().uuid().nullable().optional().default(null), instagramHandle: z.string().max(100).optional().default(""), validityDays: z.coerce.number().int().min(1).max(90).default(7), validityMinutes: z.coerce.number().int().min(1).max(60).optional(), accessDurationMinutes: z.coerce.number().int().min(5).max(525600).default(43200) });
export async function POST(request: Request) {
  if ((await auth())?.user.role !== "ADMIN") return Response.json({ message: "Non autorisé." }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ message: "Données invalides." }, { status: 400 });
  if (parsed.data.bookId && !await db.query.books.findFirst({ where: eq(books.id, parsed.data.bookId) })) return Response.json({ message: "Livre introuvable." }, { status: 400 });
  const fullCode = generateClubCode();
  const normalized = normalizeClubCode(fullCode);
  const id = crypto.randomUUID();
  const validityMs = parsed.data.validityMinutes ? parsed.data.validityMinutes * 60_000 : parsed.data.validityDays * 86_400_000;
  await db.insert(clubCodes).values({ id, bookId: parsed.data.bookId, codeHash: hashClubValue(normalized), codeHint: clubCodeHint(fullCode), instagramHandle: parsed.data.instagramHandle.trim() || null, accessDurationMinutes: parsed.data.accessDurationMinutes, expiresAt: new Date(Date.now() + validityMs) });
  return Response.json({ id, fullCode, message: "Code généré. Copiez-le maintenant : il ne sera plus affiché en entier." }, { status: 201 });
}
