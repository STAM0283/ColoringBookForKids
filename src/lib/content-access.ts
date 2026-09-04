import { getClubSession } from "./club-access";

export type ContentAccess = "PUBLIC" | "CLUB" | "BUYER";

export async function hasContentAccess(level: ContentAccess, bookId?: string | null) {
  if (level === "PUBLIC") return true;
  if (level === "CLUB") return Boolean(await getClubSession());
  if (level === "BUYER" && bookId) return Boolean(await getClubSession(bookId));
  return false;
}
