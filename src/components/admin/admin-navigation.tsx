"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BookOpen, CircleHelp, FileText, Film, ImageIcon, KeyRound, LayoutDashboard, ShieldCheck, Tags, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const groups: Array<{ label: string; links: Array<[string, string, LucideIcon]> }> = [
  { label: "Vue générale", links: [["Dashboard", "/admin", LayoutDashboard]] },
  { label: "Contenu", links: [["Livres", "/admin/livres", BookOpen], ["Images", "/admin/images", ImageIcon], ["Vidéos", "/admin/videos", Film], ["Activités", "/admin/activites", Activity], ["Catégories", "/admin/categories", Tags], ["Blog", "/admin/blog", FileText]] },
  { label: "Gestion", links: [["Codes d’accès", "/admin/codes-acces", KeyRound], ["Sécurité", "/admin/securite", ShieldCheck], ["Guide", "/admin/guide", CircleHelp]] },
];

export function AdminNavigation() {
  const pathname = usePathname();
  const active = (href: string) => href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`) || (href === "/admin/videos" && pathname.startsWith("/admin/vlog"));
  return <nav aria-label="Navigation du backoffice" className="mt-3 space-y-6">{groups.map(group => <div key={group.label}><p className="mb-2 hidden px-3 text-[11px] font-black uppercase tracking-[.18em] text-white md:block">{group.label}</p><div className="grid grid-cols-2 gap-1 md:grid-cols-1">{group.links.map(([label, href, Icon]) => { const current = active(href); return <Link key={href} href={href} aria-current={current ? "page" : undefined} className={cn("relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white", current && "bg-white text-slate-950 shadow-lg hover:bg-white hover:text-slate-950")}><Icon size={18}/><span>{label}</span>{current && <span className="absolute right-3 size-2 rounded-full bg-emerald-500"/>}</Link>; })}</div></div>)}</nav>;
}
