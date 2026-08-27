"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, LoaderCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function BookCreationExperience({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const allow = useRef(false);
  const pending = useRef<HTMLFormElement | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const completed = () => {
      setConfirming(false);
      setSuccess(true);
      window.setTimeout(() => router.replace("/admin/livres"), 1600);
    };
    window.addEventListener("admin-content-updated", completed, { once: true });
    return () => window.removeEventListener("admin-content-updated", completed);
  }, [router]);

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

  return <div onSubmitCapture={intercept}>
    {children}
    {confirming && <Dialog close={() => setConfirming(false)}><div className="p-7 text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-amber-100 text-amber-700"><AlertTriangle size={30}/></span><h2 className="mt-5 text-2xl font-black text-slate-950">Créer ce livre ?</h2><p className="mt-3 leading-relaxed text-slate-500">Vérifiez la langue, la couverture et les informations saisies avant de l’ajouter au catalogue.</p><div className="mt-7 grid grid-cols-2 gap-3"><button type="button" onClick={() => setConfirming(false)} className="rounded-xl border py-3 font-bold text-slate-600">Revenir</button><button type="button" onClick={confirm} className="rounded-xl bg-slate-950 py-3 font-black text-white">Confirmer</button></div></div></Dialog>}
    {success && <Dialog close={() => router.replace("/admin/livres")}><div className="p-8 text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 size={32}/></span><h2 className="mt-5 text-2xl font-black text-slate-950">Livre créé avec succès</h2><p className="mt-3 text-slate-500">La fiche et ses médias sont enregistrés. Retour à la liste…</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-emerald-700"><LoaderCircle className="animate-spin" size={17}/>Chargement du catalogue</span></div></Dialog>}
  </div>;
}

function Dialog({ children, close }: { children: React.ReactNode; close: () => void }) {
  return <div className="fixed inset-0 z-[140] grid place-items-center bg-slate-950/75 p-4 backdrop-blur-md" onMouseDown={close}><div role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()} className="relative w-full max-w-lg rounded-[1.75rem] bg-white shadow-2xl"><button type="button" aria-label="Fermer" onClick={close} className="absolute right-4 top-4 grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-500"><X size={18}/></button>{children}</div></div>;
}
