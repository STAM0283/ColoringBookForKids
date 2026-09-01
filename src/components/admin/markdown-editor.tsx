"use client";

import { Eye, FileCode2 } from "lucide-react";
import { useState } from "react";
import { articleContentToHtml } from "@/lib/rich-text";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  label?: string;
  help?: string;
  maximumLength?: number;
  minimumLength?: number;
  required?: boolean;
  compact?: boolean;
};

export function MarkdownEditor({ value, onChange, name, label="Contenu Markdown", help="Rédigez, puis vérifiez le rendu avec l’aperçu.", maximumLength=100000, minimumLength=10, required=true, compact=false }: MarkdownEditorProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const tab = "inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-black transition";
  const remaining = maximumLength - value.length;
  const height = compact ? "min-h-32" : "min-h-80";
  const emptyHeight = compact ? "min-h-20" : "min-h-52";

  return <div>
    <div className="mb-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <p className="flex items-center gap-1 text-sm font-bold">{label} {required&&<><span aria-hidden="true" className="text-rose-600">*</span><span className="sr-only">(obligatoire)</span></>}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{help}</p>
      </div>
      <div className="markdown-editor-tabs flex w-fit rounded-xl bg-slate-100 p-1 dark:bg-white/[.06]">
        <button type="button" onClick={()=>setMode("write")} className={`${tab} ${mode==="write"?"is-active bg-white text-emerald-700 shadow-sm":"text-slate-500 dark:text-slate-300"}`}><FileCode2 size={16}/> Markdown</button>
        <button type="button" onClick={()=>setMode("preview")} className={`${tab} ${mode==="preview"?"is-active bg-white text-emerald-700 shadow-sm":"text-slate-500 dark:text-slate-300"}`}><Eye size={16}/> Aperçu</button>
      </div>
    </div>
    {mode==="write"?<textarea value={value} minLength={minimumLength} maxLength={maximumLength} onChange={event=>onChange(event.target.value)} className={`${height} w-full rounded-xl border px-4 py-4 font-mono text-sm font-normal leading-6 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-slate-950/45 dark:text-slate-100 dark:focus:ring-emerald-500/15`} placeholder="# Mon titre&#10;&#10;Un paragraphe avec du **gras**…" required={required}/>:<div className={`${height} rounded-xl border bg-[#fdfbf7] p-5 transition-colors dark:border-white/10 dark:bg-slate-950/45`}><p className="mb-4 border-b pb-3 text-xs font-black uppercase tracking-[.16em] text-emerald-700 dark:border-white/10 dark:text-emerald-300">Aperçu du contenu</p>{value.trim()?<div className="rich-article text-base font-normal leading-7 text-slate-700 dark:text-slate-200" dangerouslySetInnerHTML={{__html:articleContentToHtml(value)}}/>:<div className={`grid ${emptyHeight} place-items-center text-center text-sm text-slate-400 dark:text-slate-500`}>Le rendu apparaîtra ici après avoir ajouté du Markdown.</div>}</div>}
    <div className="mt-2 flex items-center justify-between gap-3 text-xs font-semibold text-slate-400 dark:text-slate-500"><span>{minimumLength > 0 ? `${minimumLength} caractères minimum` : "Description facultative"}</span><span className={`rounded-full px-2.5 py-1 tabular-nums ${remaining <= Math.min(1000, maximumLength*.1) ? "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300" : "bg-slate-100 dark:bg-white/[.06] dark:text-slate-300"}`}>{remaining.toLocaleString("fr-FR")} restants</span></div>
    {name&&<input type="hidden" name={name} value={value}/>} 
  </div>;
}
