"use client";

import { useLayoutEffect, useRef } from "react";

const POSITION_KEY = "public-pagination-viewport-position";

export function PaginationPositionKeeper({ page, children }: { page: number; children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const stored = sessionStorage.getItem(POSITION_KEY);
    if (!stored || !root.current) return;
    sessionStorage.removeItem(POSITION_KEY);
    const expectedTop = Number(stored);
    if (!Number.isFinite(expectedTop)) return;
    const currentTop = root.current.getBoundingClientRect().top;
    window.scrollBy({ top: currentTop - expectedTop, behavior: "instant" });
  }, [page]);

  function rememberPosition(event: React.MouseEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element) || !event.target.closest("a")) return;
    const top = root.current?.getBoundingClientRect().top;
    if (top !== undefined) sessionStorage.setItem(POSITION_KEY, String(top));
  }

  return <div ref={root} onClick={rememberPosition}>{children}</div>;
}
