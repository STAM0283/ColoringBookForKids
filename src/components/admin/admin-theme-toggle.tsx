"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function AdminThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const dark = mounted && resolvedTheme === "dark";
  return <button
    type="button"
    aria-label={dark ? "Activer le mode clair" : "Activer le mode sombre"}
    onClick={() => setTheme(dark ? "light" : "dark")}
    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
  >
    {dark ? <Sun size={18}/> : <Moon size={18}/>}
    <span>{dark ? "Mode clair" : "Mode sombre"}</span>
  </button>;
}
