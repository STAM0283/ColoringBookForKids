import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Heart, Lightbulb, Palette, PencilLine, Sparkles, Users } from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { localizedPath, type Locale } from "@/lib/i18n";

function getSteps(locale: Locale) { const en = locale === "en"; return [
  { icon: Lightbulb, number: "01", title: en ? "A family idea" : "Une idée en famille", description: en ? "It all begins with a wish, a question or a world imagined with our daughter." : "Tout commence par une envie, une question ou un univers imaginé avec notre fille.", color: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300" },
  { icon: Sparkles, number: "02", title: en ? "A creative playground" : "Un terrain créatif", description: en ? "We explore shapes, characters and atmospheres, using artificial intelligence as a creative tool." : "Nous explorons les formes, les personnages et les ambiances, avec l’intelligence artificielle comme outil de création.", color: "bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300" },
  { icon: PencilLine, number: "03", title: en ? "Human choices" : "Des choix humains", description: en ? "Every proposal is selected, adjusted and carefully refined to remain clear, joyful and age-appropriate." : "Chaque proposition est sélectionnée, ajustée et retravaillée avec attention pour rester claire, joyeuse et adaptée.", color: "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300" },
  { icon: BookOpen, number: "04", title: en ? "Ready to color" : "Prêt à colorier", description: en ? "The book comes to life, offering children a calm, free moment and pride in their creations." : "Le livre prend vie pour offrir aux enfants un moment calme, libre et fier de leurs créations.", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300" },
]; }

function getValues(locale: Locale) { const en = locale === "en"; return [
  { icon: Palette, title: en ? "Create freely" : "Créer librement", description: en ? "There is no single right color: every child is free to invent their own." : "Il n’existe pas une seule bonne couleur : chaque enfant peut inventer la sienne." },
  { icon: Brain, title: en ? "Grow at their own pace" : "Grandir à son rythme", description: en ? "Accessible activities that build patience, independence and concentration." : "Des activités accessibles pour développer patience, autonomie et concentration." },
  { icon: Users, title: en ? "Share simply" : "Partager simplement", description: en ? "Creative moments to enjoy alone or with a parent, brother or sister." : "Des parenthèses créatives à vivre seul, avec un parent, un frère ou une sœur." },
]; }

export function AboutPage({ locale }: { locale: Locale }) {
  const en = locale === "en";
  const steps = getSteps(locale);
  const values = getValues(locale);
  return <div className="overflow-hidden">
    <section className="container py-12 sm:py-16 lg:py-20">
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
        <div>
          <SectionHeader eyebrow={en ? "Our story" : "Notre histoire"} title={en ? "Ideas born as a family, drawn from the heart" : "Des idées nées en famille, dessinées avec le cœur"} description={en ? "Le Petit Crayon turns little moments of imagination into activities that inspire children to create away from screens." : "Le Petit Crayon transforme les petits moments d’imagination en activités qui donnent envie de créer loin des écrans."} />
          <div className="mt-7 max-w-2xl space-y-5 text-lg leading-8 text-foreground/70 dark:text-slate-200">
            <p>{en ? "The adventure began at home, through ideas shared with our daughter, inspired by her wishes and her imagination." : "L’aventure est née à la maison, au fil des idées partagées avec notre fille, de ses envies et de son imagination."}</p>
            <p>{en ? "We use artificial intelligence as a creative tool, then every book is thoughtfully designed, selected and refined. Behind every page are our perspective, our ideas and a great deal of love." : "Nous utilisons l’intelligence artificielle comme un outil créatif, puis chaque livre est pensé, choisi et retravaillé avec soin. Derrière chaque page, il y a notre regard, nos réflexions et beaucoup d’amour."}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={localizedPath("books", locale)} className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 font-black text-white shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:brightness-110">{en ? "Discover the books" : "Découvrir les livres"} <ArrowRight size={18}/></Link>
            <Link href={localizedPath("activities", locale)} className="focus-ring inline-flex min-h-12 items-center rounded-full border bg-card px-6 font-black text-foreground transition hover:border-primary/40 hover:text-primary">{en ? "Activities" : "Activités"}</Link>
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
                <p className="mt-6 font-display text-2xl font-black text-foreground sm:text-3xl">{en ? "One idea, a thousand colors" : "Une idée, mille couleurs"}</p>
                <div className="mx-auto mt-5 flex justify-center gap-2">{["bg-amber-400","bg-rose-400","bg-emerald-500","bg-sky-500","bg-violet-500"].map(color=><span key={color} className={`size-4 rounded-full ${color}`}/>)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="border-y bg-secondary/35 py-16 dark:border-white/10 dark:bg-secondary/10 sm:py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center"><SectionHeader eyebrow={en ? "Behind the scenes" : "Dans les coulisses"} title={en ? "How is a book created?" : "Comment naît un livre ?"} description={en ? "A little four-step adventure, from the first spark to the final pencil stroke." : "Une petite aventure en quatre étapes, de la première étincelle au dernier trait de crayon."}/></div>
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
      <div className="mx-auto max-w-3xl text-center"><SectionHeader eyebrow={en ? "What guides us" : "Ce qui nous guide"} title={en ? "Small values for big ideas" : "De petites valeurs pour de grandes idées"} description={en ? "Every piece of content is designed to give children space for their own pace and personality." : "Chaque contenu est imaginé pour laisser de la place à l’enfant, à son rythme et à sa personnalité."}/></div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {values.map(({icon:Icon,title,description},index)=><article key={title} className="group rounded-[2rem] border bg-card p-7 text-center transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl dark:border-white/10">
          <span className={`mx-auto grid size-16 place-items-center rounded-2xl transition group-hover:rotate-3 group-hover:scale-105 ${index===0?"bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300":index===1?"bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300":"bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"}`}><Icon size={28}/></span>
          <h2 className="mt-5 font-display text-xl font-black">{title}</h2><p className="mt-3 leading-7 text-foreground/60">{description}</p>
        </article>)}
      </div>
    </section>

    <section className="container pb-16 sm:pb-24">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-transparent bg-primary px-6 py-12 text-center text-white shadow-2xl shadow-primary/20 transition-colors dark:border-emerald-300/15 dark:bg-gradient-to-br dark:from-[#173f35] dark:via-[#12382f] dark:to-[#0d2b25] dark:shadow-[0_28px_70px_-35px_rgba(52,211,153,.35)] sm:px-12 sm:py-16">
        <div aria-hidden="true" className="absolute inset-0 hidden bg-[radial-gradient(circle_at_50%_0%,rgba(110,231,183,.13),transparent_48%)] dark:block"/>
        <Heart className="absolute -left-4 -top-5 size-28 -rotate-[18deg] text-white/10 dark:text-emerald-200/[.07]" fill="currentColor" aria-hidden="true"/>
        <Sparkles className="absolute -bottom-5 -right-3 size-28 rotate-12 text-white/10 dark:text-emerald-200/[.08]" aria-hidden="true"/>
        <p className="relative text-sm font-black uppercase tracking-[.22em] text-white/70 dark:text-emerald-100/75">{en ? "Our wish" : "Notre souhait"}</p>
        <blockquote className="relative mx-auto mt-5 max-w-4xl text-balance font-display text-3xl font-black leading-tight text-white sm:text-4xl">{en ? "“To give every child the desire to pick up their crayons and the freedom to imagine what comes next.”" : "« Donner à chaque enfant l’envie de prendre ses crayons et la liberté d’inventer la suite. »"}</blockquote>
        <Link href={localizedPath("books", locale)} className="focus-ring group relative mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-black text-primary shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-amber-50 hover:shadow-xl dark:border dark:border-emerald-300/25 dark:bg-emerald-700 dark:text-white dark:shadow-[0_12px_30px_-12px_rgba(16,185,129,.7)] dark:hover:border-emerald-200/40 dark:hover:bg-emerald-600"><span>{en ? "Enter our world" : "Entrer dans l’univers"}</span> <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1"/></Link>
      </div>
    </section>
  </div>;
}
