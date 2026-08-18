import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play } from "lucide-react";
import { Badge, Card } from "./ui";
import { BookImageCarousel } from "./public/book-image-carousel";
import { ClubDownloadButton } from "./public/club-download-button";

const colors = ["bg-[#d9eadf]", "bg-[#f6dfce]", "bg-[#dce4f3]", "bg-[#f1dce4]"];

export function BookCard({ item, coverPath, gallery = [], index = 0 }: { item: { title: string; slug: string; shortDescription: string; description: string; ageMin: number | null; ageMax: number | null; pageCount: number | null; amazonUrl: string | null; pricingType: "FREE"|"PAID"; priceCents: number|null; currency: string }; coverPath?: string | null; gallery?: Array<{ path: string; alt: string | null }>; index?: number }) {
  const href = `/livres/${item.slug}`;
  const external = false;
  const images = [...(coverPath ? [{ path: coverPath, alt: `Couverture de ${item.title}` }] : []), ...gallery.map(image => ({ path: image.path, alt: image.alt || `Image de ${item.title}` }))];
  const fallback = <div className="h-[78%] w-[45%] rotate-[-4deg] rounded-md border-4 border-white/80 bg-card p-4 text-center shadow-xl transition duration-300 group-hover:rotate-0 group-hover:scale-105"><span className="text-4xl">{["🦊", "🌿", "🚀", "🐳"][index % 4]}</span><p className="mt-4 font-display text-sm font-black">{item.title}</p></div>;
  return <Card className="group overflow-hidden dark:border-white/10"><div className={`aspect-[4/3] ${colors[index % 4]} dark:brightness-[.8] relative grid place-items-center overflow-hidden`}><BookImageCarousel images={images} title={item.title} fallback={fallback}/></div><div className="p-6"><div className="flex flex-wrap gap-2"><Badge>{item.ageMin ?? 3}–{item.ageMax ?? 8} ans</Badge>{item.pageCount && <Badge>{item.pageCount} pages</Badge>}<span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${item.pricingType==="FREE"?"bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300":"bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300"}`}>{item.pricingType==="FREE"?"Gratuit":item.priceCents?new Intl.NumberFormat("fr-FR",{style:"currency",currency:item.currency}).format(item.priceCents/100):"Payant"}</span></div><h3 className="mt-4 font-display text-2xl font-bold">{item.title}</h3><Link className="mt-5 inline-flex items-center gap-2 font-bold text-primary" href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>Découvrir <ArrowRight size={17}/></Link></div></Card>;
}

export function ActivityCard({ item, index = 0, clubUnlocked = false }: { item: { id: string; title: string; description: string; pageCount: number | null; accessLevel: "PUBLIC" | "CLUB"; downloadEnabled: boolean; previewPath?: string | null; previewAlt?: string | null }; index?: number; clubUnlocked?: boolean }) {
  return <Card className="group overflow-hidden dark:border-white/10"><div className={`relative aspect-[4/3] ${colors[(index + 1) % 4]} dark:brightness-[.8] grid place-items-center overflow-hidden`}>{item.previewPath?<Image src={`/media/${item.previewPath}`} alt={item.previewAlt||`Aperçu de ${item.title}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-contain p-3 transition duration-300 group-hover:scale-[1.03]"/>:<span className="text-7xl transition group-hover:scale-110">{["✏️", "🧩", "🔎", "🦁"][index % 4]}</span>}</div><div className="p-5"><div className="flex flex-wrap gap-2"><Badge>Gratuit · {item.pageCount ?? 1} pages</Badge>{item.accessLevel === "CLUB" && <Badge>Club Instagram</Badge>}</div><h3 className="mt-3 font-display text-xl font-bold">{item.title}</h3><ClubDownloadButton activityId={item.id} clubOnly={item.accessLevel === "CLUB"} unlocked={clubUnlocked} enabled={item.downloadEnabled}/></div></Card>;
}

export function PostCard({ item, coverPath }: { item: { title: string; slug: string; excerpt: string }; coverPath?: string | null }) {
  return <Card className="group flex h-full flex-col overflow-hidden dark:border-white/10">
    {coverPath && <div className="relative aspect-[16/9] overflow-hidden bg-secondary/30"><Image src={`/media/${coverPath}`} alt={`Illustration de ${item.title}`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.03]"/></div>}
    <div className="flex flex-1 flex-col p-6"><Badge>Inspiration</Badge><h3 className="mt-4 text-balance font-display text-2xl font-bold leading-tight">{item.title}</h3><p className="mt-3 line-clamp-3 leading-relaxed text-foreground/60">{item.excerpt}</p><Link className="mt-auto inline-flex items-center gap-2 pt-6 font-bold text-primary" href={`/blog/${item.slug}`}>Lire l’article <ArrowRight size={17}/></Link></div>
  </Card>;
}

export function VlogCard({ item, thumbnailPath }: { item: { title: string; description: string }; thumbnailPath?: string | null }) {
  return <Card className="group flex h-full flex-col overflow-hidden dark:border-white/10"><div className="relative grid aspect-video place-items-center overflow-hidden bg-[#dce4f3] dark:bg-slate-900">{thumbnailPath?<Image src={`/media/${thumbnailPath}`} alt={`Aperçu de ${item.title}`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.03]"/>:<span className="text-6xl">🎨</span>}<span className="absolute grid size-14 place-items-center rounded-full bg-white/95 text-primary shadow-lg transition group-hover:scale-110"><Play fill="currentColor"/></span></div><div className="flex flex-1 flex-col p-5"><h3 className="text-balance font-display text-xl font-bold">{item.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground/60">{item.description}</p><Link href="/videos" className="mt-auto pt-5 font-bold text-primary">Regarder</Link></div></Card>;
}
