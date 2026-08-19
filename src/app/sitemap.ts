import type { MetadataRoute } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { books, media, posts } from "@/db/schema";
import { mediaUrl, siteUrl } from "@/lib/seo";

// Production migrations run after the application has been built. Generate the
// sitemap at request time so a fresh deployment does not query tables that do
// not exist yet during `next build`.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [publishedBooks, publishedPosts] = await Promise.all([
    db.select({ slug: books.slug, updatedAt: books.updatedAt, coverPath: media.path }).from(books).leftJoin(media, eq(books.coverMediaId, media.id)).where(eq(books.published, true)).orderBy(desc(books.updatedAt)),
    db.select({ slug: posts.slug, updatedAt: posts.updatedAt, coverPath: media.path }).from(posts).leftJoin(media, eq(posts.coverMediaId, media.id)).where(eq(posts.published, true)).orderBy(desc(posts.updatedAt)),
  ]);
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl(), changeFrequency: "weekly", priority: 1 },
    { url: siteUrl("/livres"), changeFrequency: "weekly", priority: .9 },
    { url: siteUrl("/activites"), changeFrequency: "weekly", priority: .9 },
    { url: siteUrl("/blog"), changeFrequency: "weekly", priority: .8 },
    { url: siteUrl("/images"), changeFrequency: "weekly", priority: .7 },
    { url: siteUrl("/videos"), changeFrequency: "weekly", priority: .7 },
    { url: siteUrl("/a-propos"), changeFrequency: "monthly", priority: .6 },
  ];
  return [...staticPages,
    ...publishedBooks.map(book => ({ url: siteUrl(`/livres/${book.slug}`), lastModified: book.updatedAt, changeFrequency: "monthly" as const, priority: .9, images: book.coverPath ? [mediaUrl(book.coverPath)!] : undefined })),
    ...publishedPosts.map(post => ({ url: siteUrl(`/blog/${post.slug}`), lastModified: post.updatedAt, changeFrequency: "monthly" as const, priority: .8, images: post.coverPath ? [mediaUrl(post.coverPath)!] : undefined })),
  ];
}
