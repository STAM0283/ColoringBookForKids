"use client";

import { Eye, FileCode2 } from "lucide-react";
import { useState } from "react";
import { articleContentToHtml } from "@/lib/rich-text";

export function MarkdownEditor({ value, onChange, name }: { value: string; onChange: (value: string) => void; name?: string }) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const tab = "inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-black transition";
  const maximumLength = 100000;
  const remaining = maximumLength - value.length;

  return <div>
    <div className="mb-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <p className="flex items-center gap-1 text-sm font-bold">Contenu Markdown <span aria-hidden="true" className="text-rose-600">*</span><span className="sr-only">(obligatoire)</span></p>
        <p className="mt-1 text-xs text-slate-500">Rédigez à gauche, puis vérifiez le rendu avec l’aperçu.</p>
      </div>
      <div className="flex w-fit rounded-xl bg-slate-100 p-1">
        <button type="button" onClick={()=>setMode("write")} className={`${tab} ${mode==="write"?"bg-white text-emerald-700 shadow-sm":"text-slate-500"}`}><FileCode2 size={16}/> Markdown</button>
        <button type="button" onClick={()=>setMode("preview")} className={`${tab} ${mode==="preview"?"bg-white text-emerald-700 shadow-sm":"text-slate-500"}`}><Eye size={16}/> Aperçu</button>
      </div>
    </div>
    {mode==="write"?<textarea value={value} maxLength={maximumLength} onChange={event=>onChange(event.target.value)} className="min-h-80 w-full rounded-xl border px-4 py-4 font-mono text-sm font-normal leading-6 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" placeholder="# Mon titre&#10;&#10;Un paragraphe avec du **gras**…" required/>:<div className="min-h-80 rounded-xl border bg-[#fdfbf7] p-6"><p className="mb-5 border-b pb-3 text-xs font-black uppercase tracking-[.16em] text-emerald-700">Aperçu du contenu</p>{value.trim()?<div className="rich-article text-base font-normal leading-8 text-slate-700" dangerouslySetInnerHTML={{__html:articleContentToHtml(value)}}/>:<div className="grid min-h-52 place-items-center text-center text-sm text-slate-400">Le rendu apparaîtra ici après avoir ajouté du Markdown.</div>}</div>}
    <div className="mt-2 flex items-center justify-between gap-3 text-xs font-semibold text-slate-400"><span>10 caractères minimum</span><span className={`rounded-full px-2.5 py-1 tabular-nums ${remaining <= 1000 ? "bg-amber-100 text-amber-800" : "bg-slate-100"}`}>{remaining.toLocaleString("fr-FR")} restants</span></div>
    {name&&<input type="hidden" name={name} value={value}/>} 
  </div>;
}
