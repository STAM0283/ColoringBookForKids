"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { articleContentToHtml } from "@/lib/rich-text";

export function ActivityDescriptionToggle({ title, description, locale = "fr" }: { title: string; description: string; locale?: "fr" | "en" }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const en = locale === "en";
  const content = description.trim();

  return <>
    <div className="mt-3 flex items-start justify-between gap-3">
      <h3 className="min-w-0 flex-1 text-balance font-display text-xl font-bold">{title}</h3>
      {content && <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls={panelId} aria-label={open ? (en ? "Hide description" : "Masquer la description") : (en ? "Show description" : "Afficher la description")} title={open ? (en ? "Hide description" : "Masquer la description") : (en ? "Show description" : "Afficher la description")} className="grid size-10 shrink-0 place-items-center rounded-full border border-foreground/10 bg-foreground/[.035] text-foreground/70 transition hover:border-primary/30 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20">
        <ChevronDown size={19} className={`transition-transform duration-300 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}/>
      </button>}
    </div>
    {content && <div id={panelId} aria-hidden={!open} className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out motion-reduce:transition-none ${open ? "mt-3 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"}`}>
      <div className="min-h-0 overflow-hidden">
        <div className="max-h-52 overflow-y-auto rounded-2xl border border-foreground/10 bg-foreground/[.025] px-4 py-3 text-sm leading-6 text-foreground/70 dark:bg-white/[.035]">
          <div className="rich-article [&_h2]:text-base [&_h3]:text-sm [&_p]:my-1.5 [&_ul]:my-1.5" dangerouslySetInnerHTML={{ __html: articleContentToHtml(content) }}/>
        </div>
      </div>
    </div>}
  </>;
}
