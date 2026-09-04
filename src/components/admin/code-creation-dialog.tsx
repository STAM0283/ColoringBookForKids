"use client";

import { useEffect, useRef, useState } from "react";
import { Clock3, Gift, Instagram, KeyRound, LoaderCircle, ShieldCheck, Timer, X } from "lucide-react";
import { AdminSelect } from "./admin-select";
import { AccessBookSelect } from "./pdf-access-settings";

const validityOptions = [{ value: "1d", label: "1 jour" }, { value: "7d", label: "7 jours" }, { value: "14d", label: "14 jours" }, { value: "30d", label: "30 jours" }, { value: "5m", label: "5 minutes · test" }];
const durationOptions = [{ value: "1440", label: "1 jour" }, { value: "10080", label: "7 jours" }, { value: "43200", label: "30 jours" }, { value: "129600", label: "3 mois" }, { value: "259200", label: "6 mois" }, { value: "525600", label: "12 mois" }, { value: "5", label: "5 minutes · test" }];

export function CodeCreationDialog({ close, created }: { close: () => void; created: (code: string) => void }) {
  const [scope, setScope] = useState<"CLUB" | "BUYER">("CLUB");
  const [bookId, setBookId] = useState("");
  const [validity, setValidity] = useState("7d");
  const [duration, setDuration] = useState("43200");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending.current && !document.querySelector('[role="listbox"]')) close();
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [close]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    if (scope === "BUYER" && !bookId) { setError("Choisissez le livre auquel ce code sera lié."); return; }
    pending.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/club-codes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: scope === "BUYER" ? bookId : null, instagramHandle: reference.trim(), validityDays: validity.endsWith("d") ? Number(validity.slice(0, -1)) : 7, validityMinutes: validity.endsWith("m") ? Number(validity.slice(0, -1)) : undefined, accessDurationMinutes: Number(duration) }),
      });
      const data = await response.json();
      if (!response.ok || !data.fullCode) throw new Error(data.message || "Création impossible.");
      created(data.fullCode);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Connexion impossible. Veuillez réessayer."); }
    finally { pending.current = false; setBusy(false); }
  }

  return <div className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-slate-950/75 p-3 backdrop-blur-md sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget && !busy) close(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="code-create-title" onKeyDown={event => {
      if (event.key !== "Tab" || document.querySelector('[role="listbox"]')) return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled):not([type="hidden"]), a[href], summary, select:not(:disabled)')).filter(element => element.getClientRects().length > 0);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }} className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900 sm:max-h-[calc(100dvh-3rem)]">
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-100 bg-emerald-50/60 p-4 dark:border-white/10 dark:bg-emerald-400/5 sm:px-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white"><KeyRound size={21}/></span>
        <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-700 dark:text-emerald-300">Accès personnalisé</p><h2 id="code-create-title" className="text-xl font-black text-slate-950 dark:text-white">Créer un code</h2></div>
        <button ref={closeRef} type="button" aria-label="Fermer" disabled={busy} onClick={close} className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:rotate-90 hover:bg-white dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10 disabled:opacity-40 motion-reduce:transform-none"><X size={20}/></button>
      </header>
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <fieldset disabled={busy}><legend className="mb-2 text-sm font-bold text-slate-800 dark:text-slate-200">Que débloque ce code ?</legend><div className="grid gap-2 sm:grid-cols-2">
            {[{ value: "CLUB" as const, title: "Club Instagram", text: "Tous les PDF réservés au Club", icon: Instagram }, { value: "BUYER" as const, title: "Bonus d’un livre", text: "Un livre et ses activités associées", icon: Gift }].map(item => <label key={item.value} className={`flex cursor-pointer gap-3 rounded-2xl border p-3 transition-colors ${scope === item.value ? "border-emerald-500 bg-emerald-50 dark:border-emerald-400/60 dark:bg-emerald-400/10" : "border-slate-200 bg-slate-50/50 hover:border-emerald-300 dark:border-white/10 dark:bg-white/[.025]"}`}><input type="radio" name="codeScope" value={item.value} checked={scope === item.value} onChange={() => { setScope(item.value); setError(""); }} className="mt-1 size-4 accent-emerald-600"/><span><span className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"><item.icon size={16}/>{item.title}</span><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{item.text}</span></span></label>)}
          </div></fieldset>
          {scope === "BUYER" && <div className={busy ? "pointer-events-none opacity-60" : ""}><AccessBookSelect value={bookId} onChange={setBookId}/></div>}
          <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2"><legend className="sr-only">Durées du code</legend><div><AdminSelect label="Délai d’activation" icon={<Timer size={17}/>} value={validity} onChange={setValidity} options={validityOptions}/><p className="mt-1.5 px-1 text-xs text-slate-500 dark:text-slate-400">À compter de la génération du code.</p></div><div><AdminSelect label="Durée de l’accès" icon={<Clock3 size={17}/>} value={duration} onChange={setDuration} options={durationOptions}/><p className="mt-1.5 px-1 text-xs text-slate-500 dark:text-slate-400">À compter de son activation.</p></div></fieldset>
          <details className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-white/10"><summary className="cursor-pointer font-semibold text-slate-600 dark:text-slate-300">Ajouter une référence parent <span className="font-normal text-slate-400">· facultatif</span></summary><label className="mt-3 block"><span className="sr-only">Référence parent</span><input disabled={busy} maxLength={100} value={reference} onChange={event => setReference(event.target.value)} placeholder="@parent_exemple ou référence de commande" className="min-h-11 w-full rounded-xl border bg-white px-3 text-base dark:border-white/10 dark:bg-slate-950 dark:text-white"/></label></details>
          <p className="flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300"/>{scope === "BUYER" ? "Code à usage unique, limité au livre choisi. Vérifiez l’achat auprès du parent avant de le transmettre." : "Code à usage unique. Vérifiez l’appartenance au Club auprès du parent avant de le transmettre."}</p>
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">{error}</p>}
        </div>
        <footer className="flex shrink-0 gap-2 border-t border-slate-100 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-950/30 sm:px-6"><button type="button" disabled={busy} onClick={close} className="min-h-12 rounded-xl border px-4 text-sm font-bold text-slate-600 transition hover:bg-white dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5">Annuler</button><button disabled={busy || (scope === "BUYER" && !bookId)} className="group flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 font-black text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-500 active:translate-y-0 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transform-none">{busy ? <LoaderCircle size={18} className="animate-spin"/> : <KeyRound size={18}/>} {busy ? "Génération…" : "Générer le code"}</button></footer>
      </form>
    </section>
  </div>;
}
