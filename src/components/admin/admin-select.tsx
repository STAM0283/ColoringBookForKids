"use client";

import { CheckCircle2, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type AdminSelectOption = { value: string; label: string };

export function AdminSelect({ label, icon, value, options, onChange, className = "", placement = "inline" }: { label: string; icon?: React.ReactNode; value: string; options: AdminSelectOption[]; onChange: (value: string) => void; className?: string; placement?: "up" | "down" | "inline" }) {
  const buttonRef = useRef<HTMLButtonElement>(null), menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false), [position, setPosition] = useState({ left: 0, top: 0, width: 0, maxHeight: 256 });
  const selected = options.find(option => option.value === value) ?? options[0];

  function toggle() {
    if (open) return setOpen(false);
    const rect = buttonRef.current?.getBoundingClientRect(); if (!rect) return;
    const viewportGap=12,panelPadding=18,availableBelow=window.innerHeight-rect.bottom-viewportGap-panelPadding,availableAbove=rect.top-viewportGap-panelPadding;
    const openUp=placement==="up"||(placement!=="down"&&availableBelow<176&&availableAbove>availableBelow);
    const maxHeight=Math.max(112,Math.min(224,openUp?availableAbove:availableBelow));
    const top=openUp?Math.max(viewportGap,rect.top-maxHeight-panelPadding-8):Math.min(rect.bottom+8,window.innerHeight-maxHeight-panelPadding-viewportGap);
    setPosition({left:Math.max(viewportGap,Math.min(rect.left,window.innerWidth-rect.width-viewportGap)),top,width:Math.min(rect.width,window.innerWidth-viewportGap*2),maxHeight});
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => { const target = event.target as Node; if (!buttonRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false); };
    const close = () => setOpen(false);
    document.addEventListener("pointerdown", closeOutside); window.addEventListener("resize", close); window.addEventListener("scroll", close, true);
    return () => { document.removeEventListener("pointerdown", closeOutside); window.removeEventListener("resize", close); window.removeEventListener("scroll", close, true); };
  }, [open]);

  return <div className={`relative ${className}`}>
    <button ref={buttonRef} type="button" aria-haspopup="listbox" aria-expanded={open} onClick={toggle} className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border bg-white px-4 dark:border-white/15 dark:bg-card text-left shadow-sm outline-none transition hover:border-emerald-300 hover:shadow-md focus-visible:ring-4 focus-visible:ring-emerald-100 ${open ? "border-emerald-500 ring-4 ring-emerald-100" : "border-slate-200 dark:border-white/15"}`}>
      {icon && <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">{icon}</span>}
      <span className="min-w-0 flex-1"><span className="block text-[10px] font-black uppercase tracking-[.15em] text-slate-400 dark:text-foreground/45">{label}</span><span className="block truncate text-sm font-black text-slate-800 dark:text-foreground">{selected?.label}</span></span>
      <ChevronDown size={18} className={`shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}/>
    </button>
    {open && createPortal(<div ref={menuRef} role="listbox" aria-label={label} className="fixed z-[10000] overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/15 dark:bg-card p-2 shadow-[0_22px_60px_-18px_rgba(15,23,42,.45)]" style={{ left: position.left, top: position.top, width: position.width }}><div className="space-y-1 overflow-y-auto" style={{ maxHeight: position.maxHeight }}>{options.map(option => <button key={option.value || "empty"} role="option" aria-selected={option.value === value} type="button" onClick={() => { onChange(option.value); setOpen(false); }} className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-bold transition ${option.value === value ? "bg-emerald-700 text-white" : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-foreground/75 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"}`}><span className="truncate">{option.label}</span>{option.value === value && <CheckCircle2 size={17}/>}</button>)}</div></div>, document.body)}
  </div>;
}
