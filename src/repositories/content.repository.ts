import { and, asc, desc, eq, getTableColumns, inArray, like, lt, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/db";
import { activities, bookGallery, books, categories, media, posts, vlogs } from "@/db/schema";

export type ListingOptions = { page?: number; pageSize?: number; search?: string; category?: string; pricing?: "FREE" | "PAID"; sort?: "newest" | "oldest" };

function bounds(options: ListingOptions) {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, options.pageSize ?? 12));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

function pageResult<T>(pagination: ReturnType<typeof bounds>, items: T[], total: number) {
  return { ...pagination, items, total, pages: Math.ceil(total / pagination.pageSize) };
}

export const contentRepository = {
  async books(options: ListingOptions = {}) {
    const pagination = bounds(options);
    const where = and(eq(books.published, true), options.search ? or(like(books.title, `%${options.search}%`), like(books.shortDescription, `%${options.search}%`)) : undefined, options.category ? eq(categories.slug, options.category) : undefined, options.pricing ? eq(books.pricingType, options.pricing) : undefined);
    const dateOrder = options.sort === "oldest" ? asc(books.publishedAt) : desc(books.publishedAt);
    const rows = await db.select({ book: books, category: categories, cover: media }).from(books).leftJoin(categories, eq(books.categoryId, categories.id)).leftJoin(media, eq(books.coverMediaId, media.id)).where(where).orderBy(desc(books.featured), dateOrder, asc(books.sortOrder)).limit(pagination.pageSize).offset(pagination.offset);
    // Une carte n'affiche que quatre visuels : ne chargeons pas le reste de la galerie.
    const galleryRows = rows.length ? await db.select({ bookId: bookGallery.bookId, image: media }).from(bookGallery).innerJoin(media, eq(bookGallery.mediaId, media.id)).where(and(inArray(bookGallery.bookId, rows.map(row => row.book.id)), lt(bookGallery.sortOrder, 4))).orderBy(asc(bookGallery.sortOrder)) : [];
    const galleryByBook = new Map<string, Array<typeof media.$inferSelect>>();
    for (const item of galleryRows) { const gallery = galleryByBook.get(item.bookId) ?? []; gallery.push(item.image); galleryByBook.set(item.bookId, gallery); }
    const items = rows.map(row => ({ ...row, gallery: galleryByBook.get(row.book.id) ?? [] }));
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(books).leftJoin(categories, eq(books.categoryId, categories.id)).where(where);
    return pageResult(pagination, items, Number(count));
  },

  async bookCategories() {
    return db.select({ name: categories.name, slug: categories.slug, color: categories.color }).from(categories).innerJoin(books, eq(books.categoryId, categories.id)).where(eq(books.published, true)).groupBy(categories.id).orderBy(asc(categories.name));
  },

  async activities(options: ListingOptions = {}) {
    const pagination = bounds(options), where = and(eq(activities.published, true), options.search ? or(like(activities.title, `%${options.search}%`),like(activities.description, `%${options.search}%`)): undefined,options.category?sql`exists (select 1 from activity_categories ac inner join categories c on c.id=ac.category_id where ac.activity_id=${activities.id} and c.slug=${options.category})`:undefined), pdf = alias(media, "activity_pdf"), preview = alias(media, "activity_preview"),dateOrder=options.sort==="oldest"?asc(activities.publishedAt):desc(activities.publishedAt);
    const items = await db.select({ ...getTableColumns(activities), pdfPath: pdf.path, previewPath: preview.path, previewAlt: preview.alt }).from(activities).leftJoin(pdf, eq(activities.pdfMediaId, pdf.id)).leftJoin(preview, eq(activities.previewMediaId, preview.id)).where(where).orderBy(desc(activities.featured), dateOrder).limit(pagination.pageSize).offset(pagination.offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(activities).where(where);
    return pageResult(pagination, items, Number(count));
  },

  async posts(options: ListingOptions = {}) {
    const pagination = bounds(options), where = and(eq(posts.published, true), options.search ? or(like(posts.title, `%${options.search}%`),like(posts.excerpt, `%${options.search}%`)): undefined,options.category?eq(categories.slug,options.category):undefined),dateOrder=options.sort==="oldest"?asc(posts.publishedAt):desc(posts.publishedAt);
    const items = await db.select({ post: posts, cover: media }).from(posts).leftJoin(media, eq(posts.coverMediaId, media.id)).leftJoin(categories,eq(posts.categoryId,categories.id)).where(where).orderBy(desc(posts.featured), dateOrder).limit(pagination.pageSize).offset(pagination.offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(posts).leftJoin(categories,eq(posts.categoryId,categories.id)).where(where);
    return pageResult(pagination, items, Number(count));
  },

  async vlogs(options: ListingOptions = {}) {
    const pagination = bounds(options), where = and(eq(vlogs.published, true), options.search ? or(like(vlogs.title, `%${options.search}%`),like(vlogs.description, `%${options.search}%`)): undefined), thumbnail = alias(media, "home_vlog_thumbnail"),dateOrder=options.sort==="oldest"?asc(vlogs.publishedAt):desc(vlogs.publishedAt);
    const items = await db.select({ vlog: vlogs, thumbnail }).from(vlogs).leftJoin(thumbnail, eq(vlogs.thumbnailMediaId, thumbnail.id)).where(where).orderBy(desc(vlogs.featured), dateOrder).limit(pagination.pageSize).offset(pagination.offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(vlogs).where(where);
    return pageResult(pagination, items, Number(count));
  },
  async activityCategoryOptions(){return db.select({name:categories.name,slug:categories.slug}).from(categories).where(sql`exists (select 1 from activity_categories ac inner join activities a on a.id=ac.activity_id where ac.category_id=${categories.id} and a.published=1)`).orderBy(asc(categories.name))},
  async postCategoryOptions(){return db.select({name:categories.name,slug:categories.slug}).from(categories).innerJoin(posts,eq(posts.categoryId,categories.id)).where(eq(posts.published,true)).groupBy(categories.id).orderBy(asc(categories.name))},
};
