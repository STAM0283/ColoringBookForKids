import { hasClubAccess } from "@/lib/club-access";
export async function GET() { return Response.json({ active: await hasClubAccess() }, { headers: { "Cache-Control": "no-store" } }); }
