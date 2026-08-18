import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { media, posts } from "@/db/schema";
import { articleContentToHtml } from "@/lib/rich-text";
import { jsonLd, mediaUrl, SITE_NAME, siteUrl } from "@/lib/seo";

async function getPost(slug: string) {
  const [result] = await db.select({ post: posts, cover: media }).from(posts)
    .leftJoin(media, eq(posts.coverMediaId, media.id))
    .where(and(eq(posts.slug, slug), eq(posts.published, true))).limit(1);
  return result;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPost(slug);
  if (!result) return {};
  const title = result.post.seoTitle || result.post.title, description = result.post.seoDescription || result.post.excerpt, image = mediaUrl(result.cover?.path);
  return { title, description, alternates: { canonical: `/blog/${slug}` }, openGraph: { type: "article", url: `/blog/${slug}`, title, description, publishedTime: result.post.publishedAt?.toISOString(), modifiedTime: result.post.updatedAt.toISOString(), authors: [result.post.authorName], images: image ? [{ url: image, alt: result.cover?.alt || result.post.title }] : undefined }, twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined } };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPost(slug);
  if (!result) notFound();
  const structuredData = { "@context": "https://schema.org", "@type": "BlogPosting", headline: result.post.title, description: result.post.excerpt, url: siteUrl(`/blog/${slug}`), image: mediaUrl(result.cover?.path), datePublished: result.post.publishedAt?.toISOString(), dateModified: result.post.updatedAt.toISOString(), author: { "@type": "Organization", name: result.post.authorName || SITE_NAME }, publisher: { "@type": "Organization", name: SITE_NAME } };

  return <article className="container max-w-4xl py-16 md:py-24"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}/>
    <Link href="/blog" className="group mb-10 inline-flex w-fit items-center gap-2 rounded-full border bg-card px-4 py-2.5 font-bold text-foreground shadow-sm transition hover:-translate-x-1 hover:border-primary/30 hover:text-primary hover:shadow-md">
      <ArrowLeft size={18} className="transition group-hover:-translate-x-0.5" />
      Retour au blog
    </Link>
    <p className="text-sm font-black uppercase tracking-[.2em] text-primary">Le journal</p>
    <h1 className="mt-4 break-words font-display text-4xl font-black leading-tight md:text-6xl">{result.post.title}</h1>
    <p className="mt-5 max-w-3xl break-words text-lg leading-8 text-foreground/75 dark:text-slate-200">{result.post.excerpt}</p>
    <p className="mt-5 text-sm font-semibold text-foreground/60">Par {result.post.authorName}</p>
    {result.cover && <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-[2rem] bg-card shadow-xl ring-1 ring-border"><Image fill priority sizes="(max-width: 896px) 100vw, 896px" src={`/media/${result.cover.path}`} alt={result.cover.alt || result.post.title} className="object-contain" /></div>}
    <div className="rich-article mt-10 text-lg leading-8" dangerouslySetInnerHTML={{ __html: articleContentToHtml(result.post.content) }} />
    <aside className="mt-14 overflow-hidden rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-orange-50 p-6 shadow-sm dark:border-emerald-800/60 dark:from-emerald-950/70 dark:via-card dark:to-orange-950/40 md:p-9">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm"><BookOpen size={27}/></span>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-black text-foreground">Envie de continuer l’aventure&nbsp;?</h2>
          <p className="mt-3 leading-7 text-foreground/75">Découvrez les <strong className="text-foreground">livres de coloriage et d’activités du Petit Crayon</strong>, imaginés pour permettre aux enfants de <strong className="text-foreground">colorier, jouer, observer et apprendre en s’amusant.</strong></p>
          <Link href="/livres" className="group mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">Découvrir nos livres <ArrowRight size={18} className="transition group-hover:translate-x-1"/></Link>
        </div>
      </div>
    </aside>
  </article>;
}
