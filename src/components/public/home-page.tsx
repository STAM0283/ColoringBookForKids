import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Download, Palette, PlayCircle, Sparkles } from "lucide-react";
import { contentRepository } from "@/repositories/content.repository";
import { ActivityCard, PostCard, VlogCard } from "@/components/content-cards";
import { EmptyState, SectionHeader } from "@/components/ui";
import { hasClubAccess } from "@/lib/club-access";
import { INSTAGRAM_URL } from "@/lib/site-config";

export async function HomePage() {
  const [books, activities, posts, vlogs, clubUnlocked] = await Promise.all([
    contentRepository.books({ pageSize: 3 }),
    contentRepository.activities({ pageSize: 4 }),
    contentRepository.posts({ pageSize: 3 }),
    contentRepository.vlogs({ pageSize: 3 }),
    hasClubAccess(),
  ]);

  return (
    <>
      <section className="paper-grid relative isolate overflow-hidden py-14 dark:bg-gradient-to-b dark:from-[#111a18] dark:to-background md:py-24">
        <div className="pointer-events-none absolute -left-24 top-12 -z-10 size-72 rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-400/10" aria-hidden="true"/>
        <div className="pointer-events-none absolute -right-20 bottom-0 -z-10 size-80 rounded-full bg-emerald-200/35 blur-3xl dark:bg-emerald-400/10" aria-hidden="true"/>
        <div className="container grid items-center gap-12 lg:grid-cols-[1.04fr_.96fr] lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/80 px-4 py-2 text-sm font-black text-primary shadow-sm backdrop-blur dark:bg-white/5">
              <Sparkles size={16} aria-hidden="true" /> La créativité commence ici
            </span>
            <h1 className="mt-6 text-balance font-display text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">
              De petits crayons.<br />
              <span className="relative text-primary">De grandes histoires.<span className="absolute -bottom-2 left-0 h-2 w-full rounded-full bg-amber-300/50 dark:bg-amber-300/25" aria-hidden="true"/></span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-foreground/65">
              Des livres de coloriage pleins de tendresse et des activités gratuites pour <strong className="font-black text-foreground/85">grandir, rêver et créer</strong> à son rythme.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/livres" className="focus-ring group inline-flex min-h-14 items-center gap-2 rounded-full bg-primary px-7 font-black text-white shadow-lg shadow-primary/20 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                Découvrir les livres <ArrowRight size={18} className="transition group-hover:translate-x-1"/>
              </Link>
              <Link href="/activites" className="focus-ring group inline-flex min-h-14 items-center gap-2 rounded-full border bg-card px-7 font-black shadow-sm transition duration-300 hover:-translate-y-1 hover:border-amber-400 hover:text-amber-700 hover:shadow-lg dark:hover:text-amber-300">
                <Download size={18}/> Activités gratuites
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-bold text-foreground/55">
              <span className="inline-flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">✓</span> À imprimer</span>
              <span className="inline-flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300">✓</span> Adapté aux enfants</span>
              <span className="inline-flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300">✓</span> Imaginé avec cœur</span>
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-lg" aria-hidden="true">
            <div className="absolute inset-7 rotate-6 rounded-[3.5rem] bg-gradient-to-br from-amber-200 via-rose-100 to-blue-200 shadow-xl dark:from-amber-400/20 dark:via-rose-400/10 dark:to-blue-400/20"/>
            <div className="absolute inset-11 -rotate-3 overflow-hidden rounded-[3rem] border-[10px] border-white bg-gradient-to-br from-[#e4f3e8] to-[#dce9df] shadow-2xl dark:border-white/10 dark:from-emerald-950 dark:to-slate-900">
              <span className="absolute -right-5 top-10 size-28 rounded-full bg-amber-300/35 blur-2xl dark:bg-amber-300/10"/>
              <span className="absolute -left-8 bottom-8 size-32 rounded-full bg-sky-300/35 blur-2xl dark:bg-sky-300/10"/>
              <div className="relative grid h-full place-items-center text-center">
                <div>
                  <div className="transition duration-500 hover:scale-105 text-8xl md:text-9xl">🦊</div>
                  <p className="mt-5 font-display text-2xl font-black">L’imagination<br/><span className="text-primary">en couleurs</span></p>
                  <div className="mx-auto mt-5 flex justify-center gap-2">{["bg-rose-400","bg-amber-400","bg-emerald-500","bg-sky-500"].map(color=><span key={color} className={`size-3 rounded-full ${color}`}/>)}</div>
                </div>
              </div>
            </div>
            <span className="absolute left-0 top-10 rotate-[-12deg] text-5xl drop-shadow-md">✦</span>
            <span className="absolute right-0 top-20 rotate-12 text-5xl drop-shadow-md">✏️</span>
            <span className="absolute bottom-5 right-3 rotate-6 text-6xl drop-shadow-lg">🌈</span>
            <span className="absolute bottom-12 left-1 text-4xl drop-shadow-md">⭐</span>
          </div>
        </div>
      </section>

      <section className="container relative z-10 -mt-2 sm:-mt-5">
        <div className="grid gap-3 rounded-[2rem] border bg-card/90 p-3 shadow-[0_24px_70px_-42px_rgba(15,23,42,.5)] backdrop-blur md:grid-cols-3 dark:border-white/10">
          <HomeChoice href="/livres" icon={<BookOpen/>} eyebrow="Explorer" title="Choisir une histoire" color="bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"/>
          <HomeChoice href="/activites" icon={<Palette/>} eyebrow="Créer" title="Imprimer une activité" color="bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300"/>
          <HomeChoice href="/videos" icon={<PlayCircle/>} eyebrow="Regarder" title="Entrer dans l’atelier" color="bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300"/>
        </div>
      </section>

      <HomeSection title="Choisissez sa prochaine aventure" eyebrow="Le catalogue" href="/livres" compact>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {books.items.length ? books.items.map(item => <HomeBookCard key={item.book.id} book={item.book} coverPath={item.cover?.path} />) : <EmptyState />}
        </div>
      </HomeSection>

      <HomeSection title="À imprimer, à colorier, à partager" eyebrow="100 % gratuit" href="/activites" tint>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {activities.items.length ? activities.items.map((item, index) => <ActivityCard key={item.id} item={item} index={index} clubUnlocked={clubUnlocked} />) : <EmptyState />}
        </div>
      </HomeSection>

      <HomeSection title="Dans l’atelier" eyebrow="Dernières vidéos" href="/videos">
        <div className="grid gap-6 md:grid-cols-3">
          {vlogs.items.length ? vlogs.items.map(({vlog, thumbnail}) => <VlogCard key={vlog.id} item={vlog} thumbnailPath={thumbnail?.path} />) : <EmptyState />}
        </div>
      </HomeSection>

      <HomeSection title="Pour créer et grandir ensemble" eyebrow="Le journal" href="/blog">
        <div className="grid gap-6 md:grid-cols-3">
          {posts.items.length ? posts.items.map(({post, cover}) => <PostCard key={post.id} item={post} coverPath={cover?.path} />) : <EmptyState />}
        </div>
      </HomeSection>

      <section className="container mt-20">
        <div className="relative isolate overflow-hidden rounded-[2.5rem] border border-primary/10 bg-primary px-7 py-14 text-center text-white shadow-[0_30px_80px_-45px_rgba(15,138,104,.65)] dark:border-emerald-300/15 dark:bg-gradient-to-br dark:from-emerald-950 dark:via-slate-900 dark:to-teal-950 dark:shadow-[0_30px_90px_-45px_rgba(16,185,129,.35)] md:px-16">
          <div className="pointer-events-none absolute -left-16 -top-20 -z-10 size-64 rounded-full bg-white/10 blur-3xl dark:bg-emerald-400/10" aria-hidden="true"/>
          <div className="pointer-events-none absolute -bottom-24 -right-16 -z-10 size-72 rounded-full bg-amber-200/15 blur-3xl dark:bg-teal-300/10" aria-hidden="true"/>
          <p className="mx-auto grid size-20 place-items-center rounded-[1.75rem] border border-white/20 bg-white/15 text-5xl shadow-xl backdrop-blur-sm dark:border-emerald-200/15 dark:bg-white/5" aria-hidden="true">📸</p>
          <h2 className="mt-6 text-balance font-display text-3xl font-black md:text-5xl">Montrez-nous vos chefs-d’œuvre !</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80 dark:text-emerald-50/75">Rejoignez notre communauté et partagez vos créations avec <strong className="font-black text-white">#LesPetitsCrayons</strong>.</p>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="focus-ring group mt-8 inline-flex min-h-12 items-center rounded-full bg-white px-7 font-black text-primary shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-emerald-300 dark:text-emerald-950 dark:hover:bg-emerald-200">
            Nous suivre sur Instagram <span className="ml-2 transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
          </a>
        </div>
      </section>
    </>
  );
}

function HomeChoice({href,icon,eyebrow,title,color}:{href:string;icon:React.ReactNode;eyebrow:string;title:string;color:string}) {
  return <Link href={href} className="focus-ring group flex min-h-24 items-center gap-4 rounded-[1.4rem] px-4 transition duration-300 hover:-translate-y-1 hover:bg-secondary/45">
    <span className={`grid size-14 shrink-0 place-items-center rounded-2xl transition duration-300 group-hover:rotate-3 group-hover:scale-105 ${color}`}>{icon}</span>
    <span className="min-w-0 flex-1"><span className="block text-[10px] font-black uppercase tracking-[.18em] text-foreground/40">{eyebrow}</span><span className="mt-1 block font-display text-lg font-black">{title}</span></span>
    <ArrowRight size={18} className="shrink-0 text-primary opacity-50 transition group-hover:translate-x-1 group-hover:opacity-100"/>
  </Link>;
}

function HomeBookCard({book,coverPath}:{book:{slug:string;title:string;shortDescription:string;ageMin:number|null;ageMax:number|null;pageCount:number|null;pricingType:"FREE"|"PAID"};coverPath?:string}) {
  const age=book.ageMin!==null&&book.ageMax!==null?`${book.ageMin}–${book.ageMax} ans`:null;
  return <Link href={`/livres/${book.slug}`} className="group grid min-h-48 overflow-hidden rounded-[1.5rem] border bg-card shadow-[0_16px_45px_-34px_rgba(15,23,42,.55)] transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl sm:grid-cols-[150px_1fr]">
    <div className="relative min-h-48 overflow-hidden bg-primary/10">{coverPath?<Image src={`/media/${coverPath}`} alt={`Couverture de ${book.title}`} fill quality={88} sizes="150px" className="object-contain p-3 transition duration-500 group-hover:scale-105"/>:<span className="grid size-full place-items-center text-primary"><BookOpen size={38}/></span>}</div>
    <div className="flex min-w-0 flex-col justify-center p-5"><div className="flex flex-wrap gap-2">{age&&<span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-black uppercase">{age}</span>}{book.pageCount&&<span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-black uppercase">{book.pageCount} pages</span>}<span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase text-blue-700">{book.pricingType==="FREE"?"Gratuit":"Payant"}</span></div><h3 className="mt-3 text-balance font-display text-xl font-black leading-tight">{book.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground/55">{book.shortDescription}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-primary">Voir le livre <ArrowRight size={16} className="transition group-hover:translate-x-1"/></span></div>
  </Link>;
}

function HomeSection({ title, eyebrow, href, children, tint = false, compact = false }: { title: string; eyebrow: string; href: string; children: React.ReactNode; tint?: boolean; compact?: boolean }) {
  return (
    <section className={`${tint ? "my-20 bg-secondary/35 py-20" : `container ${compact ? "mt-12" : "mt-20"}`} content-auto`}>
      <div className={tint ? "container" : ""}>
        <div className="flex items-end justify-between gap-4">
          <div className={compact ? "[&>div]:mb-5 [&_h2]:md:text-4xl" : ""}><SectionHeader title={title} eyebrow={eyebrow} as="h2" /></div>
          <Link href={href} className={`${compact ? "mb-6" : "mb-9"} focus-ring group hidden min-h-11 items-center gap-3 rounded-full border border-primary/15 bg-card/85 py-2 pl-5 pr-2 font-black text-primary shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/15 sm:inline-flex dark:border-emerald-300/15 dark:bg-white/5`}>
            Tout voir <span className="grid size-8 place-items-center rounded-full bg-primary/10 transition duration-300 group-hover:translate-x-0.5 group-hover:bg-white/20"><ArrowRight size={17} aria-hidden="true" /></span>
          </Link>
        </div>
        {children}
      </div>
    </section>
  );
}
