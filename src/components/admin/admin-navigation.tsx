"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, BookOpen, CircleHelp, FileText, Film, Heart,
  ImageIcon, KeyRound, LayoutDashboard, ListTree, QrCode, ShieldCheck, Tags,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavigationLink = { label: string; href: string; icon: LucideIcon };
type NavigationItem = NavigationLink | { label: string; icon: LucideIcon; children: NavigationLink[] };

const groups: Array<{ label: string; links: NavigationItem[] }> = [
  { label: "Vue générale", links: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }] },
  {
    label: "Contenu",
    links: [
      { label: "Livres", href: "/admin/livres", icon: BookOpen },
      { label: "Activités", href: "/admin/activites", icon: Activity },
      { label: "Images", href: "/admin/images", icon: ImageIcon },
      { label: "Vidéos", href: "/admin/videos", icon: Film },
      { label: "Blog", href: "/admin/blog", icon: FileText },
    ],
  },
  {
    label: "Organisation",
    links: [
      { label: "Personnages", href: "/admin/personnages", icon: Heart },
      { label: "Catégories", href: "/admin/categories", icon: Tags },
      { label: "Types d’activités", href: "/admin/types-activites", icon: ListTree },
    ],
  },
  {
    label: "Outils",
    links: [
      { label: "Générateur QR", href: "/admin/qr-code", icon: QrCode },
      { label: "Codes d’accès", href: "/admin/codes-acces", icon: KeyRound },
    ],
  },
  {
    label: "Gestion",
    links: [
      { label: "Sécurité", href: "/admin/securite", icon: ShieldCheck },
      { label: "Guide", href: "/admin/guide", icon: CircleHelp },
    ],
  },
];

export function AdminNavigation() {
  const pathname = usePathname();
  const active = (href: string) => href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`)
      || (href === "/admin/videos" && pathname.startsWith("/admin/vlog"));

  const renderLink = ({ label, href, icon: Icon }: NavigationLink, nested = false) => {
    const current = active(href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={current ? "page" : undefined}
        className={cn(
          "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition-all duration-200 hover:translate-x-0.5 hover:bg-white/10 hover:text-white active:scale-[.98]",
          nested && "ml-4 min-h-10 border-l border-white/10 pl-4 text-[13px]",
          current && "bg-white text-slate-950 shadow-lg shadow-black/15 hover:translate-x-0 hover:bg-white hover:text-slate-950",
        )}
      >
        <Icon className="shrink-0 transition-transform duration-200 group-hover:scale-110" size={nested ? 16 : 18} />
        <span className="truncate">{label}</span>
        {current && <span className="absolute right-3 size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.14)]" />}
      </Link>
    );
  };

  return (
    <nav aria-label="Navigation du backoffice" className="mt-3 space-y-5">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 hidden px-3 text-[11px] font-black uppercase tracking-[.18em] text-slate-400 md:block">{group.label}</p>
          <div className="grid grid-cols-2 gap-1 md:grid-cols-1">
            {group.links.map((item) => {
              if ("href" in item) return renderLink(item);
              const GroupIcon = item.icon;
              const groupActive = item.children.some((child) => active(child.href));
              return (
                <div key={item.label} className="col-span-2 rounded-2xl bg-white/[.035] p-1 md:col-span-1">
                  <div className={cn("flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-300", groupActive && "text-emerald-300")}>
                    <GroupIcon size={18} />
                    <span>{item.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 md:grid-cols-1">
                    {item.children.map((child) => renderLink(child, true))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
