import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BookForm } from "@/components/admin/content-forms";
import { BookCreationExperience } from "@/components/admin/book-creation-experience";

export default function NewBookPage() {
  return <BookCreationExperience><div className="mx-auto max-w-6xl"><Link href="/admin/livres" className="mb-7 inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 font-bold text-slate-600 shadow-sm transition hover:-translate-x-1 hover:text-emerald-700 dark:border-white/10 dark:bg-white/[.045] dark:text-slate-200 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300"><ArrowLeft size={18}/>Retour à la liste</Link><BookForm/></div></BookCreationExperience>;
}
