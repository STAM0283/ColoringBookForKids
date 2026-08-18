"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

export function PasswordInput() {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative mt-2 block">
      <LockKeyhole
        aria-hidden="true"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        size={19}
      />
      <input
        required
        name="password"
        type={visible ? "text" : "password"}
        autoComplete="current-password"
        placeholder="Votre mot de passe"
        className="admin-login-input min-h-14 w-full rounded-2xl border border-slate-300 pl-12 pr-14 text-base font-medium outline-none transition placeholder:text-slate-500 hover:border-slate-400 focus:border-[#28765f] focus:ring-4 focus:ring-emerald-100"
      />
      <button
        type="button"
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
      >
        {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
      </button>
    </span>
  );
}
