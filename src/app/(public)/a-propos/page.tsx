import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Heart, Lightbulb, Palette, PencilLine, Sparkles, Users } from "lucide-react";
import { SectionHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "À propos de la créatrice",
  description: "Découvrez l’univers du Petit Crayon et notre mission : développer la créativité, l’autonomie et la concentration des enfants.",
  alternates: { canonical: "/a-propos" },
  openGraph: { url: "/a-propos", title: "L’histoire du Petit Crayon", description: "Des livres et activités imaginés avec soin pour encourager les enfants à créer." },
};

const steps = [
  { icon: Lightbulb, number: "01", title: "Une idée en famille", description: "Tout commence par une envie, une question ou un univers imaginé avec notre fille.", color: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300" },
  { icon: Sparkles, number: "02", title: "Un terrain créatif", description: "Nous explorons les formes, les personnages et les ambiances, avec l’intelligence artificielle comme outil de création.", color: "bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300" },
  { icon: PencilLine, number: "03", title: "Des choix humains", description: "Chaque proposition est sélectionnée, ajustée et retravaillée avec attention pour rester claire, joyeuse et adaptée.", color: "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300" },
  { icon: BookOpen, number: "04", title: "Prêt à colorier", description: "Le livre prend vie pour offrir aux enfants un moment calme, libre et fier de leurs créations.", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300" },
];

const values = [
  { icon: Palette, title: "Créer librement", description: "Il n’existe pas une seule bonne couleur : chaque enfant peut inventer la sienne." },
  { icon: Brain, title: "Grandir à son rythme", description: "Des activités accessibles pour développer patience, autonomie et concentration." },
  { icon: Users, title: "Partager simplement", description: "Des parenthèses créatives à vivre seul, avec un parent, un frère ou une sœur." },
];

export default function Page() {
  return <div className="overflow-hidden">
    <section className="container py-12 sm:py-16 lg:py-20">
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
        <div>
          <SectionHeader eyebrow="Notre histoire" title="Des idées nées en famille, dessinées avec le cœur" description="Le Petit Crayon transforme les petits moments d’imagination en activités qui donnent envie de créer loin des écrans." />
          <div className="mt-7 max-w-2xl space-y-5 text-lg leading-8 text-foreground/70 dark:text-slate-200">
            <p>L’aventure est née à la maison, au fil des idées partagées avec notre fille, de ses envies et de son imagination.</p>
            <p>Nous utilisons l’intelligence artificielle comme un outil créatif, puis chaque livre est pensé, choisi et retravaillé avec soin. Derrière chaque page, il y a notre regard, nos réflexions et beaucoup d’amour.</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/livres" className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 font-black text-white shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:brightness-110">Découvrir les livres <ArrowRight size={18}/></Link>
            <Link href="/activites" className="focus-ring inline-flex min-h-12 items-center rounded-full border bg-card px-6 font-black text-foreground transition hover:border-primary/40 hover:text-primary">Activités gratuites</Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl" aria-hidden="true">
          <div className="absolute -left-10 top-8 size-28 rounded-full bg-amber-200/50 blur-2xl dark:bg-amber-400/15"/>
          <div className="absolute -right-10 bottom-8 size-36 rounded-full bg-emerald-200/60 blur-3xl dark:bg-emerald-400/15"/>
          <div className="relative aspect-square overflow-hidden rounded-[2.5rem] border bg-gradient-to-br from-[#fff8dc] via-[#f4fbf4] to-[#e9f2ff] p-7 shadow-[0_30px_80px_-35px_rgba(15,23,42,.35)] dark:border-white/10 dark:from-amber-400/10 dark:via-emerald-400/10 dark:to-blue-400/10 sm:rounded-[3rem] sm:p-10">
            <span className="absolute right-8 top-7 rotate-12 text-5xl sm:text-6xl">✿</span>
            <span className="absolute bottom-8 left-8 -rotate-12 text-5xl sm:text-6xl">⭐</span>
            <div className="absolute left-[12%] top-[15%] h-[70%] w-[72%] -rotate-6 rounded-[2rem] border-2 border-dashed border-emerald-700/15 bg-white/70 shadow-xl backdrop-blur-sm dark:bg-slate-950/40"/>
            <div className="absolute left-[18%] top-[19%] grid h-[68%] w-[72%] rotate-3 place-items-center rounded-[2rem] border bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-card">
              <div className="text-center">
                <span className="mx-auto grid size-24 place-items-center rounded-full bg-secondary text-6xl sm:size-28 sm:text-7xl">🎨</span>
                <p className="mt-6 font-display text-2xl font-black text-foreground sm:text-3xl">Une idée, mille couleurs</p>
                <div className="mx-auto mt-5 flex justify-center gap-2">{["bg-amber-400","bg-rose-400","bg-emerald-500","bg-sky-500","bg-violet-500"].map(color=><span key={color} className={`size-4 rounded-full ${color}`}/>)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="border-y bg-secondary/35 py-16 dark:border-white/10 dark:bg-secondary/10 sm:py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center"><SectionHeader eyebrow="Dans les coulisses" title="Comment naît un livre ?" description="Une petite aventure en quatre étapes, de la première étincelle au dernier trait de crayon."/></div>
        <div className="relative mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="absolute left-[12%] right-[12%] top-9 hidden border-t-2 border-dashed border-primary/20 xl:block" aria-hidden="true"/>
          {steps.map(({icon:Icon,number,title,description,color})=><article key={number} className="relative rounded-[2rem] border bg-card p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,.5)] transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10">
            <div className="flex items-center justify-between"><span className={`relative z-10 grid size-16 place-items-center rounded-2xl ${color}`}><Icon size={28}/></span><span className="font-display text-4xl font-black text-foreground/10">{number}</span></div>
            <h2 className="mt-6 font-display text-xl font-black">{title}</h2><p className="mt-3 leading-7 text-foreground/60">{description}</p>
          </article>)}
        </div>
      </div>
    </section>

    <section className="container py-16 sm:py-20">
      <div className="mx-auto max-w-3xl text-center"><SectionHeader eyebrow="Ce qui nous guide" title="De petites valeurs pour de grandes idées" description="Chaque contenu est imaginé pour laisser de la place à l’enfant, à son rythme et à sa personnalité."/></div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {values.map(({icon:Icon,title,description},index)=><article key={title} className="group rounded-[2rem] border bg-card p-7 text-center transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl dark:border-white/10">
          <span className={`mx-auto grid size-16 place-items-center rounded-2xl transition group-hover:rotate-3 group-hover:scale-105 ${index===0?"bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300":index===1?"bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300":"bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"}`}><Icon size={28}/></span>
          <h2 className="mt-5 font-display text-xl font-black">{title}</h2><p className="mt-3 leading-7 text-foreground/60">{description}</p>
        </article>)}
      </div>
    </section>

    <section className="container pb-16 sm:pb-24">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-primary px-6 py-12 text-center text-white shadow-2xl shadow-primary/20 sm:px-12 sm:py-16">
        <Heart className="absolute -left-4 -top-5 size-28 -rotate-[18deg] text-white/10" fill="currentColor" aria-hidden="true"/>
        <Sparkles className="absolute -bottom-5 -right-3 size-28 rotate-12 text-white/10" aria-hidden="true"/>
        <p className="text-sm font-black uppercase tracking-[.22em] text-white/70">Notre souhait</p>
        <blockquote className="mx-auto mt-5 max-w-4xl text-balance font-display text-3xl font-black leading-tight sm:text-4xl">« Donner à chaque enfant l’envie de prendre ses crayons et la liberté d’inventer la suite. »</blockquote>
        <Link href="/livres" className="focus-ring mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-black text-primary shadow-lg transition hover:-translate-y-0.5 hover:bg-amber-50">Entrer dans l’univers <ArrowRight size={18}/></Link>
      </div>
    </section>
  </div>;
}
