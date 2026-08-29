import "server-only";
import { and, asc, desc, eq, getTableColumns, ilike, inArray, lt, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { activities, activityCategories, activityGallery, activityTypes, bookGallery, books, categories, media, posts, vlogs } from "@/db/schema";

export type ContentLanguage = "FR" | "EN";
export type ListingOptions = { page?: number; pageSize?: number; search?: string; category?: string; activityType?: string; pricing?: "FREE" | "PAID"; sort?: "newest" | "oldest"; language?: ContentLanguage };

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
    const search = searchPattern(options.search);
    const where = and(eq(books.published, true), eq(books.language, options.language ?? "FR"), search ? or(ilike(books.title, search), ilike(books.shortDescription, search)) : undefined, options.category ? eq(categories.slug, options.category) : undefined, options.pricing ? eq(books.pricingType, options.pricing) : undefined);
    const dateOrder = options.sort === "oldest" ? asc(books.publishedAt) : desc(books.publishedAt);
    const [rows, [{ count }]] = await Promise.all([
      db.select({ book: books, category: categories, cover: media }).from(books).leftJoin(categories, eq(books.categoryId, categories.id)).leftJoin(media, eq(books.coverMediaId, media.id)).where(where).orderBy(desc(books.featured), dateOrder, asc(books.sortOrder)).limit(pagination.pageSize).offset(pagination.offset),
      db.select({ count: sql<number>`count(*)` }).from(books).leftJoin(categories, eq(books.categoryId, categories.id)).where(where),
    ]);
    // Une carte n'affiche que quatre visuels : ne chargeons pas le reste de la galerie.
    const galleryRows = rows.length ? await db.select({ bookId: bookGallery.bookId, image: media }).from(bookGallery).innerJoin(media, eq(bookGallery.mediaId, media.id)).where(and(inArray(bookGallery.bookId, rows.map(row => row.book.id)), lt(bookGallery.sortOrder, 4))).orderBy(asc(bookGallery.sortOrder)) : [];
    const galleryByBook = new Map<string, Array<typeof media.$inferSelect>>();
    for (const item of galleryRows) { const gallery = galleryByBook.get(item.bookId) ?? []; gallery.push(item.image); galleryByBook.set(item.bookId, gallery); }
    const items = rows.map(row => ({ ...row, gallery: galleryByBook.get(row.book.id) ?? [] }));
    return pageResult(pagination, items, Number(count));
  },

  async bookCategories(language: ContentLanguage = "FR") {
    const rows = await db.select({ name: categories.name, slug: categories.slug, color: categories.color })
      .from(categories)
      .where(and(eq(categories.language, language), inArray(categories.scope, ["BOOK", "ACTIVITY"])))
      .orderBy(asc(categories.name));

    // Le gestionnaire actuel partage les catégories d'activités avec les
    // livres. Une ancienne catégorie BOOK peut donc avoir le même slug : le
    // filtre public ne doit afficher qu'une seule option dans ce cas.
    return [...new Map(rows.map(category => [category.slug, category])).values()];
  },

  async activities(options: ListingOptions = {}) {
    const pagination = bounds(options), search=searchPattern(options.search), where = and(eq(activities.published, true),eq(activities.language,options.language??"FR"), search ? or(ilike(activities.title,search),ilike(activities.description,search)): undefined,options.category?sql`exists (select 1 from activity_categories ac inner join categories c on c.id=ac.category_id where ac.activity_id=${activities.id} and c.slug=${options.category} and c.language=${options.language??"FR"})`:undefined,options.activityType?eq(activityTypes.slug,options.activityType):undefined), pdf = alias(media, "activity_pdf"), preview = alias(media, "activity_preview"),dateOrder=options.sort==="oldest"?asc(activities.publishedAt):desc(activities.publishedAt);
    const [items, [{ count }]] = await Promise.all([
      db.select({ ...getTableColumns(activities), activityType:activityTypes, pdfPath: pdf.path, previewPath: preview.path, previewAlt: preview.alt }).from(activities).leftJoin(activityTypes,eq(activities.activityTypeId,activityTypes.id)).leftJoin(pdf, eq(activities.pdfMediaId, pdf.id)).leftJoin(preview, eq(activities.previewMediaId, preview.id)).where(where).orderBy(desc(activities.featured), dateOrder).limit(pagination.pageSize).offset(pagination.offset),
      db.select({ count: sql<number>`count(*)` }).from(activities).leftJoin(activityTypes,eq(activities.activityTypeId,activityTypes.id)).where(where),
    ]);
    const activityIds = items.map(item => item.id);
    const [galleryRows, categoryRows] = items.length ? await Promise.all([
      db.select({ activityId: activityGallery.activityId, path: media.path, alt: media.alt }).from(activityGallery).innerJoin(media, eq(activityGallery.mediaId, media.id)).where(inArray(activityGallery.activityId, activityIds)).orderBy(asc(activityGallery.sortOrder)),
      db.select({ activityId: activityCategories.activityId, name: categories.name, color: categories.color, badge: categories.badge }).from(activityCategories).innerJoin(categories, eq(activityCategories.categoryId, categories.id)).where(inArray(activityCategories.activityId, activityIds)).orderBy(asc(categories.sortOrder), asc(categories.name)),
    ]) : [[], []];
    const galleryByActivity = new Map<string, Array<{path:string;alt:string|null}>>();
    for (const row of galleryRows) { const gallery = galleryByActivity.get(row.activityId) ?? []; gallery.push({path:row.path,alt:row.alt}); galleryByActivity.set(row.activityId,gallery); }
    const categoriesByActivity = new Map<string, Array<{name:string;color:string;badge:string}>>();
    for (const row of categoryRows) { const list = categoriesByActivity.get(row.activityId) ?? []; list.push({name:row.name,color:row.color,badge:row.badge}); categoriesByActivity.set(row.activityId,list); }
    return pageResult(pagination, items.map(item => ({...item,gallery:galleryByActivity.get(item.id)??[],categories:categoriesByActivity.get(item.id)??[]})), Number(count));
  },

  async posts(options: ListingOptions = {}) {
    const pagination = bounds(options), search=searchPattern(options.search), where = and(eq(posts.published, true),eq(posts.language,options.language??"FR"), search ? or(ilike(posts.title,search),ilike(posts.excerpt,search)): undefined,options.category?eq(categories.slug,options.category):undefined),dateOrder=options.sort==="oldest"?asc(posts.publishedAt):desc(posts.publishedAt);
    const [items, [{ count }]] = await Promise.all([
      db.select({ post: posts, cover: media }).from(posts).leftJoin(media, eq(posts.coverMediaId, media.id)).leftJoin(categories,eq(posts.categoryId,categories.id)).where(where).orderBy(desc(posts.featured), dateOrder).limit(pagination.pageSize).offset(pagination.offset),
      db.select({ count: sql<number>`count(*)` }).from(posts).leftJoin(categories,eq(posts.categoryId,categories.id)).where(where),
    ]);
    return pageResult(pagination, items, Number(count));
  },

  async vlogs(options: ListingOptions = {}) {
    const pagination = bounds(options), search=searchPattern(options.search), where = and(eq(vlogs.published, true),eq(vlogs.language,options.language??"FR"), search ? or(ilike(vlogs.title,search),ilike(vlogs.description,search)): undefined), thumbnail = alias(media, "home_vlog_thumbnail"),dateOrder=options.sort==="oldest"?asc(vlogs.publishedAt):desc(vlogs.publishedAt);
    const [items, [{ count }]] = await Promise.all([
      db.select({ vlog: vlogs, thumbnail }).from(vlogs).leftJoin(thumbnail, eq(vlogs.thumbnailMediaId, thumbnail.id)).where(where).orderBy(desc(vlogs.featured), dateOrder).limit(pagination.pageSize).offset(pagination.offset),
      db.select({ count: sql<number>`count(*)` }).from(vlogs).where(where),
    ]);
    return pageResult(pagination, items, Number(count));
  },
  async activityCategoryOptions(language:ContentLanguage="FR"){return db.select({name:categories.name,slug:categories.slug}).from(categories).where(and(eq(categories.language,language),sql`exists (select 1 from activity_categories ac inner join activities a on a.id=ac.activity_id where ac.category_id=${categories.id} and a.published=true and a.language=${language})`)).orderBy(asc(categories.name))},
  async activityTypeOptions(language:ContentLanguage="FR"){return db.select({name:activityTypes.name,slug:activityTypes.slug}).from(activityTypes).where(eq(activityTypes.language,language)).orderBy(asc(activityTypes.sortOrder),asc(activityTypes.name))},
  async postCategoryOptions(language:ContentLanguage="FR"){return db.select({name:categories.name,slug:categories.slug}).from(categories).innerJoin(posts,eq(posts.categoryId,categories.id)).where(and(eq(posts.published,true),eq(posts.language,language),eq(categories.language,language))).groupBy(categories.id).orderBy(asc(categories.name))},
};

function searchPattern(value?: string) {
  const normalized = value?.trim();
  return normalized ? `%${normalized.replace(/[\\%_]/g, character => `\\${character}`)}%` : undefined;
}
