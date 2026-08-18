import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Check, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { signIn } from "@/auth";
import { PasswordInput } from "@/components/admin/password-input";

export const metadata: Metadata = { title: "Connexion administrateur", robots: { index: false, follow: false, noarchive: true } };

export default function LoginPage() {
  async function login(data: FormData) {
    "use server";
    await signIn("credentials", {
      email: data.get("email"),
      password: data.get("password"),
      redirectTo: "/admin",
    });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f6f3] text-slate-950 dark:bg-background dark:text-foreground">
      <div className="absolute -left-24 -top-24 size-80 rounded-full bg-[#dcecdf] blur-3xl dark:bg-emerald-500/10" />
      <div className="absolute -bottom-32 -right-20 size-96 rounded-full bg-[#f4dfce] blur-3xl dark:bg-orange-400/10" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-5 py-10">
        <section className="grid w-full overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_30px_90px_-35px_rgba(15,23,42,.3)] dark:border-white/10 dark:bg-card dark:shadow-black/40 lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative hidden min-h-[680px] overflow-hidden bg-[#173f34] p-12 text-white lg:flex lg:flex-col">
            <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:25px_25px]" />
            <div className="absolute -bottom-28 -right-20 size-80 rounded-full bg-[#e4a482]/30" />
            <div className="absolute right-16 top-24 rotate-12 text-6xl opacity-90">✦</div>

            <Link href="/" className="relative inline-flex items-center gap-3 font-display text-xl font-black">
              <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-2xl">✿</span>
              Le Petit Crayon
            </Link>

            <div className="relative my-auto max-w-md">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-50">
                <Sparkles size={16} /> Espace de gestion
              </span>
              <h1 className="mt-7 font-display text-5xl font-black leading-[1.08] tracking-tight">
                Tout votre univers créatif, au même endroit.
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-emerald-50/70">
                Gérez vos livres, activités, articles et médias depuis une interface simple et sécurisée.
              </p>
              <ul className="mt-8 space-y-4 text-sm font-semibold text-emerald-50/90">
                {['Contenus centralisés', 'Médias et publications', 'Paramètres du site'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="grid size-6 place-items-center rounded-full bg-white/10"><Check size={14} /></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <p className="relative text-xs text-emerald-50/45">Administration privée · Connexion sécurisée</p>
          </div>

          <div className="flex min-h-[620px] items-center p-7 sm:p-12 lg:p-16">
            <div className="mx-auto w-full max-w-md">
              <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900 lg:hidden">
                <ArrowLeft size={17} /> Retour au site
              </Link>

              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#28765f]">
                <ShieldCheck size={25} />
              </div>
              <p className="mt-7 text-xs font-bold uppercase tracking-[.22em] text-[#38866e]">Administration</p>
              <h2 className="mt-3 font-display text-4xl font-black tracking-tight text-slate-950 dark:text-foreground">Heureux de vous revoir</h2>
              <p className="mt-3 leading-relaxed text-slate-500 dark:text-slate-300">Connectez-vous pour accéder au tableau de bord.</p>

              <form action={login} className="mt-9 space-y-5">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Adresse e-mail
                  <span className="relative mt-2 block">
                    <Mail aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                    <input required name="email" type="email" autoComplete="email" placeholder="admin@exemple.fr" className="admin-login-input min-h-14 w-full rounded-2xl border border-slate-300 pl-12 pr-4 text-base font-medium outline-none transition placeholder:text-slate-500 hover:border-slate-400 focus:border-[#28765f] focus:ring-4 focus:ring-emerald-100" />
                  </span>
                </label>

                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Mot de passe
                  <PasswordInput />
                </label>

                <button className="group flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#173f34] px-5 font-bold text-white shadow-lg shadow-emerald-950/10 transition hover:-translate-y-0.5 hover:bg-[#205343] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-200">
                  Se connecter
                  <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link href="/recuperation" className="text-sm font-bold text-[#28765f] transition hover:text-[#173f34] hover:underline">
                  Utiliser un code de récupération
                </Link>
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <LockKeyhole size={13} /> Vos identifiants sont transmis de façon sécurisée.
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
