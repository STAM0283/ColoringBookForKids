import { getClubSession } from "@/lib/club-access";
import { auth } from "@/auth";
import { z } from "zod";
export async function GET(request: Request) {
  const bookId = new URL(request.url).searchParams.get("bookId");
  if (bookId && !z.string().uuid().safeParse(bookId).success) return Response.json({ active: false }, { status: 400 });
  const active = (await auth())?.user.role === "ADMIN" || Boolean(await getClubSession(bookId || undefined));
  return Response.json({ active }, { headers: { "Cache-Control": "private, no-store" } });
}
