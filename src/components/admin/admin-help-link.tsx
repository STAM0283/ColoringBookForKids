"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp } from "lucide-react";

const anchors:Array<[string,string]>=[["/admin/livres","livres"],["/admin/activites","activites"],["/admin/images","images-videos"],["/admin/videos","images-videos"],["/admin/vlog","images-videos"],["/admin/blog","blog"],["/admin/codes-acces","club"],["/admin/securite","securite"],["/admin/parametres","sauvegarde"],["/admin","demarrage"]];

export function AdminHelpLink(){const pathname=usePathname();if(pathname==="/admin/guide")return null;const anchor=anchors.find(([path])=>path==="/admin"?pathname===path:pathname.startsWith(path))?.[1]||"demarrage";return <Link href={`/admin/guide#${anchor}`} aria-label="Ouvrir l’aide de cette page" className="admin-help-bubble group"><CircleHelp size={23} strokeWidth={2.2}/><span className="sr-only">Ouvrir l’aide de cette page</span><span aria-hidden="true" className="admin-help-label">Besoin d’aide&nbsp;?</span></Link>}
