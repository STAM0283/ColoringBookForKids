import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
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
      <section className="paper-grid overflow-hidden py-16 dark:bg-gradient-to-b dark:from-[#111a18] dark:to-background md:py-24">
        <div className="container grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-bold">
              <Sparkles size={16} aria-hidden="true" /> La créativité commence ici
            </span>
            <h1 className="mt-6 font-display text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">
              De petits crayons.<br />
              <span className="text-primary">De grandes histoires.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed opacity-70">
              Des livres de coloriage pleins de tendresse et des activités gratuites pour grandir, rêver et créer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/livres" className="rounded-full bg-primary px-6 py-4 font-bold text-white shadow-lg transition hover:-translate-y-1">
                Découvrir les livres
              </Link>
              <Link href="/activites" className="rounded-full border bg-card px-6 py-4 font-bold">
                Activités gratuites
              </Link>
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-lg" aria-hidden="true">
            <div className="absolute inset-8 rotate-3 rounded-[3rem] bg-secondary" />
            <div className="absolute inset-12 -rotate-3 rounded-[3rem] border-8 border-white bg-[#dce9df] dark:border-white/15 dark:bg-emerald-950 shadow-2xl">
              <div className="grid h-full place-items-center text-center">
                <div>
                  <div className="text-8xl md:text-9xl">🦊</div>
                  <p className="mt-5 font-display text-2xl font-black">L’imagination<br />en couleurs</p>
                </div>
              </div>
            </div>
            <span className="absolute left-3 top-8 text-5xl">✦</span>
            <span className="absolute bottom-8 right-4 text-6xl">🌈</span>
          </div>
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
        <div className="rounded-[2.5rem] bg-primary px-7 py-14 text-center text-white md:px-16">
          <p className="text-5xl" aria-hidden="true">📸</p>
          <h2 className="mt-4 font-display text-3xl font-black md:text-5xl">Montrez-nous vos chefs-d’œuvre !</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/75">Rejoignez notre communauté et partagez vos créations avec #LesPetitsCrayons.</p>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="mt-7 inline-flex rounded-full bg-white px-6 py-3 font-bold text-primary">
            Nous suivre sur Instagram
          </a>
        </div>
      </section>
    </>
  );
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
          <Link href={href} className={`${compact ? "mb-6" : "mb-9"} hidden items-center gap-2 font-bold text-primary sm:flex`}>
            Tout voir <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        {children}
      </div>
    </section>
  );
}
