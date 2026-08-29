import Link from "next/link";
import { ArrowLeft, FilePlus2 } from "lucide-react";
import { ImageToPdf } from "@/components/admin/image-to-pdf";

export default function NewActivityPage() {
  return <div className="mx-auto max-w-6xl">
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Link href="/admin/activites" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-600 shadow-sm transition hover:-translate-x-1 hover:border-emerald-300 hover:text-emerald-700 dark:border-white/10 dark:bg-white/[.045] dark:text-slate-200 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300">
        <ArrowLeft size={18}/>Retour aux activités
      </Link>
      <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-emerald-700 dark:text-emerald-300"><FilePlus2 size={16}/>Nouvelle publication</span>
    </div>
    <ImageToPdf/>
  </div>;
}
