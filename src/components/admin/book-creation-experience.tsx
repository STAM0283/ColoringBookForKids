"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ImageIcon, LoaderCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function BookCreationExperience({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const allow = useRef(false);
  const pending = useRef<HTMLFormElement | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cover, setCover] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    const completed = () => {
      setConfirming(false);
      setSuccess(true);
      window.setTimeout(() => router.replace("/admin/livres"), 1600);
    };
    window.addEventListener("admin-content-updated", completed, { once: true });
    return () => window.removeEventListener("admin-content-updated", completed);
  }, [router]);

  useEffect(() => () => { if (cover) URL.revokeObjectURL(cover.url); }, [cover]);

  function preview(event: React.FormEvent<HTMLDivElement>) {
    const input = event.target as HTMLInputElement;
    if (input.name !== "cover" || input.type !== "file") return;
    const file = input.files?.[0];
    setCover(previous => {
      if (previous) URL.revokeObjectURL(previous.url);
      return file ? { url: URL.createObjectURL(file), name: file.name } : null;
    });
  }

  function intercept(event: React.FormEvent<HTMLDivElement>) {
    if (allow.current) { allow.current = false; return; }
    event.preventDefault();
    event.stopPropagation();
    pending.current = event.target as HTMLFormElement;
    setConfirming(true);
  }

  function confirm() {
    if (!pending.current) return;
    allow.current = true;
    setConfirming(false);
    pending.current.requestSubmit();
  }

  return <div onChangeCapture={preview} onSubmitCapture={intercept}>
    {children}
    {cover && <aside aria-label="Aperçu de la couverture" className="fixed bottom-5 right-5 z-[90] w-[min(310px,calc(100vw-2.5rem))] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_24px_70px_-20px_rgba(15,23,42,.45)]">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3"><div className="min-w-0"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-emerald-700"><ImageIcon size={15}/>Aperçu couverture</p><p className="mt-1 truncate text-xs font-semibold text-slate-400" title={cover.name}>{cover.name}</p></div><button type="button" aria-label="Masquer l’aperçu" onClick={() => setCover(null)} className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><X size={17}/></button></header>
      <div className="relative aspect-[4/5] max-h-[390px] w-full bg-[linear-gradient(135deg,#f8fafc_25%,#fff_25%,#fff_50%,#f8fafc_50%,#f8fafc_75%,#fff_75%)] bg-[length:16px_16px]"><Image unoptimized fill src={cover.url} alt="Aperçu de la couverture sélectionnée" className="object-contain p-3"/></div>
      <p className="border-t bg-emerald-50/70 px-4 py-3 text-xs font-bold text-emerald-800">La couverture sera enregistrée dans ce format, sans recadrage.</p>
    </aside>}
    {confirming && <Dialog close={() => setConfirming(false)}><div className="p-7 text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-amber-100 text-amber-700"><AlertTriangle size={30}/></span><h2 className="mt-5 text-2xl font-black text-slate-950">Créer ce livre ?</h2><p className="mt-3 leading-relaxed text-slate-500">Vérifiez la langue, la couverture et les informations saisies avant de l’ajouter au catalogue.</p><div className="mt-7 grid grid-cols-2 gap-3"><button type="button" onClick={() => setConfirming(false)} className="rounded-xl border py-3 font-bold text-slate-600">Revenir</button><button type="button" onClick={confirm} className="rounded-xl bg-slate-950 py-3 font-black text-white">Confirmer</button></div></div></Dialog>}
    {success && <Dialog close={() => router.replace("/admin/livres")}><div className="p-8 text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 size={32}/></span><h2 className="mt-5 text-2xl font-black text-slate-950">Livre créé avec succès</h2><p className="mt-3 text-slate-500">La fiche et ses médias sont enregistrés. Retour à la liste…</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-emerald-700"><LoaderCircle className="animate-spin" size={17}/>Chargement du catalogue</span></div></Dialog>}
  </div>;
}

function Dialog({ children, close }: { children: React.ReactNode; close: () => void }) {
  return <div className="fixed inset-0 z-[140] grid place-items-center bg-slate-950/75 p-4 backdrop-blur-md" onMouseDown={close}><div role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()} className="relative w-full max-w-lg rounded-[1.75rem] bg-white shadow-2xl"><button type="button" aria-label="Fermer" onClick={close} className="absolute right-4 top-4 grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-500"><X size={18}/></button>{children}</div></div>;
}
