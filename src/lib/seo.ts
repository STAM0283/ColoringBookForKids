export const SITE_NAME = "Le Petit Crayon";
export const DEFAULT_DESCRIPTION = "Livres de coloriage, cahiers d’activités et PDF gratuits à imprimer pour développer la créativité des enfants en s’amusant.";

export function siteUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path.startsWith("/") || !path ? path : `/${path}`}`;
}

export function mediaUrl(path: string | null | undefined) {
  return path ? siteUrl(`/media/${path.split("/").map(encodeURIComponent).join("/")}`) : undefined;
}

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
