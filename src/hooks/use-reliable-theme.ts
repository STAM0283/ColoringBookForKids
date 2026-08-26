"use client";

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function useReliableTheme() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const toggleTheme = useCallback(() => {
    const documentIsDark = document.documentElement.classList.contains("dark");
    setTheme(documentIsDark ? "light" : "dark");
  }, [setTheme]);

  return { isDark, mounted, toggleTheme };
}
