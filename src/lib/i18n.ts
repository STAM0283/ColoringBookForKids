export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export type ContentLanguage = "FR" | "EN";

export const defaultLocale: Locale = "fr";

export function contentLanguage(locale: Locale): ContentLanguage {
  return locale === "en" ? "EN" : "FR";
}

export function localeFromPathname(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "fr";
}

const routeMap = {
  home: { fr: "/", en: "/en" },
  books: { fr: "/livres", en: "/en/books" },
  activities: { fr: "/activites", en: "/en/activities" },
  videos: { fr: "/videos", en: "/en/videos" },
  images: { fr: "/images", en: "/en/images" },
  coloring: { fr: "/coloriages", en: "/en/coloring" },
  blog: { fr: "/blog", en: "/en/blog" },
  about: { fr: "/a-propos", en: "/en/about" },
} as const;

export type PublicRoute = keyof typeof routeMap;

export function localizedPath(route: PublicRoute, locale: Locale): string {
  return routeMap[route][locale];
}

export function switchLocalePath(pathname: string, locale: Locale): string {
  const current = localeFromPathname(pathname);
  // Rechercher d'abord la route la plus précise. Sans ce tri, `/en/books`
  // correspondrait à `/en` (accueil) et produirait `//books`, interprété par
  // le navigateur comme un domaine externe nommé « books ».
  const candidates = (Object.entries(routeMap) as Array<[PublicRoute, (typeof routeMap)[PublicRoute]]>)
    .sort(([, first], [, second]) => second[current].length - first[current].length);
  const match = candidates.find(([, paths]) => pathname === paths[current] || pathname.startsWith(`${paths[current]}/`));
  if (!match) return localizedPath("home", locale);
  const [route, entry] = match;
  const suffix = pathname.slice(entry[current].length);
  // Les éditions traduites peuvent avoir des slugs différents. Sans paire
  // explicitement reliée, revenir à la liste évite une page 404 trompeuse.
  if (suffix && (route === "books" || route === "blog")) return entry[locale];
  return `${entry[locale]}${suffix}` || "/";
}

export const messages = {
  fr: {
    localeName: "Français", switchLanguage: "Afficher le site en anglais",
    navigation: { home: "Accueil", books: "Livres", activities: "Activités", videos: "Vidéos", images: "Images", coloring: "Coloriages", blog: "Blog", about: "À propos" },
  },
  en: {
    localeName: "English", switchLanguage: "View the website in French",
    navigation: { home: "Home", books: "Books", activities: "Activities", videos: "Videos", images: "Images", coloring: "Colouring", blog: "Blog", about: "About" },
  },
} as const;
