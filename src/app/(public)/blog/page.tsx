import type { Metadata } from "next";
import { contentRepository } from "@/repositories/content.repository";
import { PostCard } from "@/components/content-cards";
import { ListingFilters } from "@/components/public/listing-filters";
import { EmptyState, Pagination } from "@/components/ui";
import { Newspaper, Sparkles } from "lucide-react";
export const metadata:Metadata={title:"Conseils et idées d’activités créatives pour enfants",description:"Conseils pour les parents, idées de coloriage et activités simples pour développer la créativité des enfants.",alternates:{canonical:"/blog"},openGraph:{url:"/blog",title:"Le journal créatif du Petit Crayon",description:"Des idées et conseils pour colorier, jouer et apprendre avec les enfants."}};
export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; category?: string; sort?: string }> }) {
  const params = await searchParams;
  const sort = params.sort === "oldest" ? "oldest" : "newest";
  const [result, categories] = await Promise.all([
    contentRepository.posts({ page: Number(params.page) || 1, pageSize: 10, search: params.q, category: params.category, sort }),
    contentRepository.postCategoryOptions(),
  ]);

  return <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-b from-orange-50/35 to-background py-6 dark:from-[#171714] dark:via-[#171815] dark:to-background md:py-8"><div className="pointer-events-none absolute -right-24 -top-20 size-72 rounded-full bg-orange-200/20 blur-3xl dark:bg-orange-400/10"/><div className="container relative"><header className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-primary md:text-xs"><Sparkles size={14}/> Le journal</span><h1 className="mt-2 font-display text-3xl font-black leading-tight md:text-4xl">Idées, conseils et <span className="text-primary">bonheurs créatifs.</span></h1><p className="mt-1.5 text-sm text-foreground/60 md:text-base">Des inspirations simples pour colorier, jouer et apprendre ensemble.</p></div><div className="inline-flex w-fit items-center gap-2.5 rounded-2xl border bg-card/85 px-3 dark:border-white/10 dark:bg-white/5 py-2 shadow-sm"><Newspaper className="text-primary" size={18}/><strong className="text-lg leading-none">{result.total}</strong><span className="text-xs font-semibold text-foreground/55">article{result.total>1?"s":""}</span></div></header>
    <ListingFilters title="Trouver un article" query={params.q} category={params.category} sort={sort} categories={categories} searchPlaceholder="Rechercher un article…"/>
    <p className="mb-4 text-sm font-semibold text-foreground/60">{result.total} article{result.total > 1 ? "s" : ""} trouvé{result.total > 1 ? "s" : ""}</p>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{result.items.length ? result.items.map(({ post, cover }) => <PostCard key={post.id} item={post} coverPath={cover?.path}/>) : <EmptyState/>}</div>
    <Pagination page={result.page} pages={result.pages} path="/blog" query={{ q: params.q, category: params.category, sort }}/>
  </div></section>;
}
