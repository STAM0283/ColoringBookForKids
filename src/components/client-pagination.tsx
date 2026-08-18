"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function useClientPagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  useEffect(() => setPage(current => Math.min(current, pages)), [pages]);
  const pageItems = useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page, pageSize]);
  return { page, pages, pageItems, setPage, reset: () => setPage(1) };
}

export function ClientPagination({ page, pages, onChange, className }: { page: number; pages: number; onChange: (page: number) => void; className?: string }) {
  if (pages <= 1) return null;
  const visible = Array.from({ length: pages }, (_, index) => index + 1).filter(value => value === 1 || value === pages || Math.abs(value - page) <= 1);
  return <nav aria-label="Pagination" className={cn("mt-6 flex flex-wrap items-center justify-center gap-2 border-t pt-6", className)}>
    <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Page précédente" className="grid size-10 place-items-center rounded-xl border bg-white text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/15 dark:bg-card dark:text-slate-200 dark:hover:text-emerald-300"><ChevronLeft size={18}/></button>
    {visible.map((value, index) => <span key={value} className="contents">{index > 0 && visible[index - 1] !== value - 1 && <span className="px-1 text-slate-400 dark:text-slate-300">…</span>}<button type="button" aria-current={value === page ? "page" : undefined} onClick={() => onChange(value)} className={cn("grid size-10 place-items-center rounded-xl border bg-white text-sm font-black text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-white/15 dark:bg-card dark:text-slate-200 dark:hover:text-emerald-300", value === page && "border-emerald-700 bg-emerald-700 text-white hover:text-white dark:border-emerald-500 dark:bg-emerald-700 dark:text-white")}>{value}</button></span>)}
    <button type="button" disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="Page suivante" className="grid size-10 place-items-center rounded-xl border bg-white text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/15 dark:bg-card dark:text-slate-200 dark:hover:text-emerald-300"><ChevronRight size={18}/></button>
    <span className="ml-2 text-xs font-bold text-slate-400 dark:text-slate-300">Page {page} sur {pages}</span>
  </nav>;
}

export function SiblingPagination({ total, pageSize = 10, targetSelector = ":scope > article", containerSelector }: { total: number; pageSize?: number; targetSelector?: string; containerSelector?: string }) {
  const marker = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1), [host, setHost] = useState<HTMLElement | null>(null);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => setPage(current => Math.min(current, pages)), [pages]);
  useEffect(() => {
    const container = containerSelector ? marker.current?.parentElement?.querySelector(containerSelector) : marker.current?.previousElementSibling;
    if (!container) return;
    const portalHost = document.createElement("div");
    portalHost.dataset.pagination = "true";
    container.after(portalHost);
    setHost(portalHost);
    return () => { setHost(null); portalHost.remove(); };
  }, [containerSelector]);
  useEffect(() => {
    const container = host?.previousElementSibling;
    const elements = container?.querySelectorAll<HTMLElement>(targetSelector) ?? [];
    elements.forEach((element, index) => { element.hidden = index < (page - 1) * pageSize || index >= page * pageSize; });
    return () => elements.forEach(element => { element.hidden = false; });
  }, [host, page, pageSize, targetSelector, total]);
  return <><div ref={marker} hidden/>{host && createPortal(<ClientPagination page={page} pages={pages} onChange={setPage}/>, host)}</>;
}
