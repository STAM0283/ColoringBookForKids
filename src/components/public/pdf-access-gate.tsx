"use client";

import { useEffect, useState } from "react";
import { Gift, Instagram, KeyRound, LoaderCircle } from "lucide-react";
import type { AccessLevel } from "@/components/admin/pdf-access-settings";

export function PdfAccessGate({ accessLevel, bookId, en = false, children }: {
  accessLevel: AccessLevel; bookId?: string | null; en?: boolean; children: React.ReactNode;
}) {
  const [active, setActive] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const buyer = accessLevel === "BUYER";
  const statusUrl = buyer && bookId ? `/api/club/status?bookId=${encodeURIComponent(bookId)}` : "/api/club/status";
  useEffect(() => {
    setActive(false);
    if (accessLevel === "PUBLIC" || (buyer && !bookId)) return;
    const controller = new AbortController();
    fetch(statusUrl, { cache: "no-store", signal: controller.signal }).then(response => response.ok ? response.json() : null)
      .then(data => { if (!controller.signal.aborted) setActive(Boolean(data?.active)); }).catch(() => undefined);
    return () => controller.abort();
  }, [accessLevel, buyer, bookId, statusUrl]);

  async function activate(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/club/activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, bookId: buyer ? bookId : null }) });
      const data = await response.json();
      if (!response.ok) throw new Error(en ? "This code is invalid, expired or not valid for this content." : data.message);
      const status = await fetch(statusUrl, { cache: "no-store" });
      if (!status.ok || !(await status.json()).active) throw new Error(en ? "Access could not be confirmed." : "Impossible de confirmer l’accès.");
      setActive(true); setCode("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : (en ? "Please try again." : "Veuillez réessayer.")); }
    finally { setBusy(false); }
  }
  if (accessLevel === "PUBLIC" || (active && (!buyer || bookId))) return <>{children}</>;
  return <section className="my-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/5">
    <h3 className="flex items-center gap-2 font-bold">{buyer ? <Gift size={19}/> : <Instagram size={19}/>} {buyer ? (en ? "Book purchase bonus" : "Bonus offert avec le livre") : (en ? "Instagram Club PDF" : "PDF réservé au Club Instagram")}</h3>
    <p className="mt-2 text-sm text-foreground/65">{en ? "Parent area: enter the code you received. No child account is needed." : "Espace parent : saisissez le code reçu. Aucun compte enfant n’est nécessaire."}</p>
    {buyer && !bookId ? <p className="mt-3 text-sm">{en ? "This bonus is temporarily unavailable." : "Ce bonus est temporairement indisponible."}</p> : <form onSubmit={activate} className="mt-3 flex flex-col gap-2 sm:flex-row">
      <label className="min-w-0 flex-1"><span className="sr-only">{en ? "Access code" : "Code d’accès"}</span><input required minLength={8} maxLength={32} value={code} onChange={event => setCode(event.target.value)} placeholder="CRAYON-XXXX-XXXX" autoCapitalize="characters" autoComplete="off" spellCheck={false} className="min-h-12 w-full rounded-xl border bg-card px-3 text-base font-semibold dark:border-white/15"/></label>
      <button disabled={busy} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50">{busy ? <LoaderCircle size={17} className="animate-spin"/> : <KeyRound size={17}/>} {en ? "Unlock" : "Débloquer"}</button>
    </form>}
    {error && <p role="alert" className="mt-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>}
  </section>;
}
