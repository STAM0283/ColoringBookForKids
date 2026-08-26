"use client";

import { Moon, Sun } from "lucide-react";
import { useReliableTheme } from "@/hooks/use-reliable-theme";

export function AdminThemeToggle() {
  const { isDark: dark, toggleTheme } = useReliableTheme();
  return <button
    type="button"
    aria-label={dark ? "Activer le mode clair" : "Activer le mode sombre"}
    onClick={toggleTheme}
    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
  >
    {dark ? <Sun size={18}/> : <Moon size={18}/>}
    <span>{dark ? "Mode clair" : "Mode sombre"}</span>
  </button>;
}
