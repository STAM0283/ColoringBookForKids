"use client";

import { AlertTriangle, CheckCircle2, LoaderCircle, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function VisitorStatsReset() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function reset() {
    setLoading(true); setError("");
    const response = await fetch("/api/admin/analytics", { method: "DELETE" });
    const result = await response.json().catch(() => null) as { message?: string; removed?: number } | null;
    setLoading(false);
    if (!response.ok) { setError(result?.message || "Suppression impossible."); return; }
    setConfirming(false);
    setSuccess(`${result?.message || "Statistiques vidées."} ${result?.removed || 0} ligne${result?.removed === 1 ? "" : "s"} supprimée${result?.removed === 1 ? "" : "s"}.`);
    router.refresh();
  }

  return <>
    <button type="button" onClick={()=>setConfirming(true)} className="group inline-flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2 pl-5 text-sm font-black text-slate-700 shadow-sm transition duration-300 hover:!-translate-y-0.5 hover:!border-red-600 hover:!bg-red-600 hover:!text-white hover:shadow-lg hover:shadow-red-500/25 active:!translate-y-0 active:scale-[.97] dark:border-white/10 dark:bg-white/[.055] dark:text-slate-100 dark:hover:!border-red-500 dark:hover:!bg-red-600 dark:hover:!text-white"><span>Vider les statistiques</span><span className="grid size-9 place-items-center rounded-xl bg-rose-100 text-rose-600 transition duration-300 group-hover:-rotate-6 group-hover:scale-105 group-hover:!bg-white/20 group-hover:!text-white dark:bg-rose-400/15 dark:text-rose-300"><Trash2 size={16}/></span></button>
    {confirming&&<Modal close={loading?()=>undefined:()=>setConfirming(false)}><div className="p-8 text-center"><button type="button" aria-label="Fermer" onClick={()=>setConfirming(false)} className="absolute right-5 top-5 grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:scale-105 dark:bg-white/10 dark:text-slate-200"><X size={18}/></button><span className="mx-auto grid size-16 place-items-center rounded-full bg-red-100 text-red-600 dark:bg-red-400/15 dark:text-red-300"><AlertTriangle size={30}/></span><h2 className="mt-5 text-2xl font-black dark:text-slate-50">Vider le compteur&nbsp;?</h2><p className="mt-3 leading-relaxed text-slate-500 dark:text-slate-300">Toutes les statistiques quotidiennes et mensuelles seront définitivement supprimées. Les autres données du site ne seront pas touchées.</p>{error&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700 dark:bg-red-400/10 dark:text-red-300">{error}</p>}<div className="mt-7 grid grid-cols-2 gap-3"><button disabled={loading} onClick={()=>setConfirming(false)} className="rounded-xl border py-3 font-bold text-slate-600 transition hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5">Annuler</button><button disabled={loading} onClick={()=>void reset()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-red-500 active:translate-y-0 disabled:opacity-60">{loading?<LoaderCircle className="animate-spin" size={18}/>:<Trash2 size={17}/>} {loading?"Suppression…":"Tout supprimer"}</button></div></div></Modal>}
    {success&&<Modal close={()=>setSuccess("")}><div className="p-8 text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"><CheckCircle2 size={32}/></span><h2 className="mt-5 text-2xl font-black dark:text-slate-50">Compteur réinitialisé</h2><p className="mt-3 leading-relaxed text-slate-500 dark:text-slate-300">{success}</p><button onClick={()=>setSuccess("")} className="mt-7 w-full rounded-xl bg-slate-900 py-3 font-bold text-white transition hover:-translate-y-0.5 dark:bg-emerald-700 dark:hover:bg-emerald-600">Terminer</button></div></Modal>}
  </>;
}

function Modal({children,close}:{children:React.ReactNode;close:()=>void}){return <div className="fixed inset-0 z-[200] grid place-items-center bg-slate-950/75 p-4 backdrop-blur-md" onMouseDown={close}><div className="relative w-full max-w-md rounded-[1.75rem] border border-transparent bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900" onMouseDown={event=>event.stopPropagation()}>{children}</div></div>}
