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
    <button type="button" onClick={()=>setConfirming(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 transition hover:bg-red-50"><Trash2 size={16}/> Vider les statistiques</button>
    {confirming&&<Modal close={loading?()=>undefined:()=>setConfirming(false)}><div className="p-8 text-center"><button type="button" aria-label="Fermer" onClick={()=>setConfirming(false)} className="absolute right-5 top-5 grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600"><X size={18}/></button><span className="mx-auto grid size-16 place-items-center rounded-full bg-red-100 text-red-600"><AlertTriangle size={30}/></span><h2 className="mt-5 text-2xl font-black">Vider le compteur&nbsp;?</h2><p className="mt-3 leading-relaxed text-slate-500">Toutes les statistiques quotidiennes et mensuelles seront définitivement supprimées. Les autres données du site ne seront pas touchées.</p>{error&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}<div className="mt-7 grid grid-cols-2 gap-3"><button disabled={loading} onClick={()=>setConfirming(false)} className="rounded-xl border py-3 font-bold text-slate-600">Annuler</button><button disabled={loading} onClick={()=>void reset()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-bold text-white disabled:opacity-60">{loading?<LoaderCircle className="animate-spin" size={18}/>:<Trash2 size={17}/>} {loading?"Suppression…":"Tout supprimer"}</button></div></div></Modal>}
    {success&&<Modal close={()=>setSuccess("")}><div className="p-8 text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 size={32}/></span><h2 className="mt-5 text-2xl font-black">Compteur réinitialisé</h2><p className="mt-3 leading-relaxed text-slate-500">{success}</p><button onClick={()=>setSuccess("")} className="mt-7 w-full rounded-xl bg-slate-900 py-3 font-bold text-white">Terminer</button></div></Modal>}
  </>;
}

function Modal({children,close}:{children:React.ReactNode;close:()=>void}){return <div className="fixed inset-0 z-[200] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-md" onMouseDown={close}><div className="relative w-full max-w-md rounded-[1.75rem] bg-white shadow-2xl" onMouseDown={event=>event.stopPropagation()}>{children}</div></div>}
