"use client";

import { useEffect } from "react";

let visitAlreadySent = false;

export function VisitorTracker() {
  useEffect(() => {
    if (visitAlreadySent) return;
    visitAlreadySent = true;
    void fetch("/api/analytics/visit", { method: "POST", cache: "no-store", keepalive: true }).catch(() => undefined);
  }, []);
  return null;
}
