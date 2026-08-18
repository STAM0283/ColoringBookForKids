"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { CheckCircle2, Download, KeyRound, LoaderCircle, LockKeyhole, RefreshCw, ShieldCheck, X } from "lucide-react";
import { SiblingPagination } from "@/components/client-pagination";

type Log = { id: string; event: string; userAgent: string | null; details: string | null; createdAt: string };
type Data = { logs: Log[]; unusedRecoveryCodes: number };
const labels: Record<string, string> = { LOGIN_SUCCESS: "Connexion réussie", LOGIN_FAILURE: "Échec de connexion", ACCOUNT_LOCKED: "Compte temporairement bloqué", PASSWORD_CHANGED: "Mot de passe modifié", RECOVERY_CODES_GENERATED: "Codes de récupération renouvelés", RECOVERY_CODE_USED: "Code de récupération utilisé" };

export function SecurityManager() {
  const [data, setData] = useState<Data>({ logs: [], unusedRecoveryCodes: 0 });
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [success, setSuccess] = useState("");
  const [currentPassword, setCurrentPassword] = useState(""), [newPassword, setNewPassword] = useState(""), [confirmation, setConfirmation] = useState("");
  const [codes, setCodes] = useState<string[]>([]), [pdfBase64, setPdfBase64] = useState(""), [generating, setGenerating] = useState(false);
  const load = useCallback(async () => { setLoading(true); const response = await fetch("/api/admin/security", { cache: "no-store" }); if (response.ok) setData(await response.json() as Data); setLoading(false); }, []);
  useEffect(() => { void load(); }, [load]);

  async function changePassword(event: React.FormEvent) {
    event.preventDefault(); setError("");
    if (newPassword !== confirmation) return setError("La confirmation ne correspond pas au nouveau mot de passe.");
    const response = await fetch("/api/admin/security/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
    const result = await response.json().catch(() => null) as { message?: string } | null;
    if (!response.ok) return setError(result?.message || "Modification impossible.");
    setSuccess(result?.message || "Mot de passe modifié.");
    window.setTimeout(() => void signOut({ callbackUrl: "/connexion" }), 1800);
  }

  async function generateCodes() {
    setGenerating(true); setError("");
    const response = await fetch("/api/admin/security/recovery-codes", { method: "POST" });
    const result = await response.json().catch(() => null) as { codes?: string[]; pdfBase64?: string; message?: string } | null;
    setGenerating(false);
    if (!response.ok || !result?.codes) return setError(result?.message || "Génération impossible.");
    setCodes(result.codes); setPdfBase64(result.pdfBase64 || "");
    if (result.pdfBase64) downloadPdf(result.pdfBase64);
    await load();
  }

  function downloadPdf(base64 = pdfBase64) { const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0)); const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })); const link = document.createElement("a"); link.href = url; link.download = "codes-recuperation-petits-crayons.pdf"; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }

  const passwordFields: Array<[string,string,(value:string)=>void]> = [["Mot de passe actuel", currentPassword, setCurrentPassword], ["Nouveau mot de passe", newPassword, setNewPassword], ["Confirmer le mot de passe", confirmation, setConfirmation]];
  return <div className="mx-auto max-w-6xl"><SiblingPagination total={data.logs.length} pageSize={10} containerSelector=":scope > section.mt-6" targetSelector="tbody > tr"/><header><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Administration</p><h1 className="mt-2 text-3xl font-black">Sécurité du compte</h1><p className="mt-2 text-slate-500">Protégez l’accès au back-office et surveillez les événements sensibles.</p></header>
    {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">{error}</div>}{success && <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-700"><CheckCircle2 size={20}/>{success}</div>}
    <div className="mt-8 grid gap-6 lg:grid-cols-2"><section className="rounded-[1.75rem] border bg-white p-6 shadow-sm"><span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><LockKeyhole/></span><h2 className="mt-5 text-xl font-black">Modifier le mot de passe</h2><p className="mt-2 text-sm text-slate-500">La modification déconnecte automatiquement tous les appareils.</p><form onSubmit={changePassword} className="mt-6 space-y-4">{passwordFields.map(([label,value,setter]) => <label key={label} className="block text-sm font-bold">{label}<input required type="password" value={value} onChange={event => setter(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50"/></label>)}<p className="text-xs leading-relaxed text-slate-500">12 caractères minimum, avec majuscule, minuscule, chiffre et caractère spécial.</p><button className="w-full rounded-xl bg-slate-950 px-5 py-3 font-black text-white">Enregistrer le nouveau mot de passe</button></form></section>
      <section className="rounded-[1.75rem] border bg-white p-6 shadow-sm"><span className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><KeyRound/></span><h2 className="mt-5 text-xl font-black">Codes de récupération</h2><p className="mt-2 text-sm leading-relaxed text-slate-500">Ils permettent de choisir un nouveau mot de passe sans e-mail. Chaque code fonctionne une seule fois.</p><div className="mt-6 rounded-2xl bg-slate-50 p-5"><p className="text-sm font-bold text-slate-500">Codes encore disponibles</p><p className="mt-1 text-4xl font-black">{loading ? "—" : data.unusedRecoveryCodes}</p></div><button disabled={generating} onClick={() => void generateCodes()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-black text-white disabled:opacity-50">{generating ? <LoaderCircle className="animate-spin" size={19}/> : <RefreshCw size={19}/>} Générer 8 nouveaux codes</button><p className="mt-3 text-xs text-amber-700">Attention : cette action remplace immédiatement les anciens codes.</p></section></div>
    <section className="mt-6 overflow-hidden rounded-[1.75rem] border bg-white shadow-sm"><div className="flex items-center justify-between border-b p-6"><div><h2 className="text-xl font-black">Journal de sécurité</h2><p className="mt-1 text-sm text-slate-500">Les 100 événements les plus récents.</p></div><button aria-label="Actualiser" onClick={() => void load()} className="grid size-11 place-items-center rounded-xl border"><RefreshCw size={18}/></button></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-4 pl-6">Événement</th><th className="p-4">Date</th><th className="p-4">Appareil</th><th className="p-4">Détail</th></tr></thead><tbody>{data.logs.map(log => <tr key={log.id} className="border-t"><td className="p-4 pl-6 font-bold">{labels[log.event] || log.event}</td><td className="whitespace-nowrap p-4 text-slate-500">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(log.createdAt))}</td><td className="p-4 text-slate-500">{browser(log.userAgent)}</td><td className="p-4 text-slate-500">{log.details || "—"}</td></tr>)}</tbody></table>{!loading && !data.logs.length && <div className="grid h-40 place-items-center text-slate-500">Aucun événement enregistré.</div>}</div></section>
    {codes.length > 0 && <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm"><div className="relative w-full max-w-xl rounded-[2rem] bg-white p-8 shadow-2xl"><button aria-label="Fermer" onClick={() => setCodes([])} className="absolute right-5 top-5 grid size-10 place-items-center rounded-full bg-slate-100"><X/></button><ShieldCheck className="text-emerald-700" size={48}/><h2 className="mt-4 text-2xl font-black">PDF de récupération prêt</h2><p className="mt-2 text-sm text-slate-500">Le PDF vient d’être téléchargé. Il contient les 8 codes et les explications. Conservez-le hors de votre ordinateur si possible.</p><div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-950 p-5">{codes.map(code => <code key={code} className="text-center text-sm font-bold tracking-wide text-white">{code}</code>)}</div><button onClick={() => downloadPdf()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 font-black text-white"><Download size={18}/> Télécharger à nouveau le PDF</button></div></div>}
  </div>;
}
function browser(userAgent: string | null) { if (!userAgent) return "Inconnu"; if (/Edg\//.test(userAgent)) return "Microsoft Edge"; if (/Firefox\//.test(userAgent)) return "Firefox"; if (/Chrome\//.test(userAgent)) return "Google Chrome"; if (/Safari\//.test(userAgent)) return "Safari"; return "Autre navigateur"; }
