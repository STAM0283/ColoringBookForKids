import { and,asc,desc,eq,like,or,sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/db";
import { categories,media,mediaCategories,vlogs } from "@/db/schema";

export const mediaRepository = {
  async paginatedImages(options:{page?:number;pageSize?:number;search?:string;category?:string;sort?:"newest"|"oldest"}={}) {
    const page = Math.max(1, options.page??1), pageSize = Math.min(48, Math.max(1, options.pageSize??12));
    const where=and(eq(media.type,"IMAGE"),options.search?or(like(media.alt,`%${options.search}%`),like(media.originalName,`%${options.search}%`)):undefined,options.category?eq(categories.slug,options.category):undefined),dateOrder=options.sort==="oldest"?asc(media.createdAt):desc(media.createdAt);
    const items = await db.select(getImageColumns()).from(media).leftJoin(mediaCategories,eq(media.id,mediaCategories.mediaId)).leftJoin(categories,eq(mediaCategories.categoryId,categories.id)).where(where).orderBy(dateOrder).limit(pageSize).offset((page - 1) * pageSize);
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(media).leftJoin(mediaCategories,eq(media.id,mediaCategories.mediaId)).leftJoin(categories,eq(mediaCategories.categoryId,categories.id)).where(where);
    const total = Number(count); return { items, page, pageSize, total, pages: Math.ceil(total / pageSize) };
  },
  async imageCategoryOptions() {
    return db
      .select({ name: categories.name, slug: categories.slug })
      .from(categories)
      .where(eq(categories.scope, "ACTIVITY"))
      .orderBy(asc(categories.sortOrder), asc(categories.name));
  },
  async paginatedPublishedVideos(options:{page?:number;pageSize?:number;search?:string;category?:string;sort?:"newest"|"oldest"}={}) {
    const page = Math.max(1, options.page??1), pageSize = Math.min(48, Math.max(1, options.pageSize??9));
    const video = alias(media, "published_video");
    const thumbnail = alias(media, "published_video_thumbnail");
    const where=and(eq(vlogs.published,true),options.search?or(like(vlogs.title,`%${options.search}%`),like(vlogs.description,`%${options.search}%`)):undefined,options.category?eq(categories.slug,options.category):undefined),dateOrder=options.sort==="oldest"?asc(vlogs.publishedAt):desc(vlogs.publishedAt);
    const items = await db.select({ vlog: vlogs, video, thumbnail }).from(vlogs).leftJoin(video, eq(vlogs.videoMediaId, video.id)).leftJoin(thumbnail, eq(vlogs.thumbnailMediaId, thumbnail.id)).leftJoin(categories,eq(vlogs.categoryId,categories.id)).where(where).orderBy(desc(vlogs.featured), dateOrder).limit(pageSize).offset((page - 1) * pageSize);
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(vlogs).leftJoin(categories,eq(vlogs.categoryId,categories.id)).where(where);
    const total = Number(count); return { items, page, pageSize, total, pages: Math.ceil(total / pageSize) };
  },
  async videoCategoryOptions() {
    return db.select({ name: categories.name, slug: categories.slug }).from(categories).where(eq(categories.scope,"ACTIVITY")).orderBy(asc(categories.sortOrder),asc(categories.name));
  },
  async listImages(limit = 60) {
    return db.select().from(media).where(eq(media.type, "IMAGE")).orderBy(desc(media.createdAt)).limit(limit);
  },
  async listPublishedVideos(limit = 30) {
    return db.select({ vlog: vlogs, video: media })
      .from(vlogs)
      .leftJoin(media, eq(vlogs.videoMediaId, media.id))
      .where(eq(vlogs.published, true))
      .orderBy(desc(vlogs.featured), desc(vlogs.publishedAt))
      .limit(limit);
  },
};

function getImageColumns(){return {id:media.id,type:media.type,filename:media.filename,originalName:media.originalName,mimeType:media.mimeType,size:media.size,width:media.width,height:media.height,duration:media.duration,path:media.path,alt:media.alt,createdAt:media.createdAt,updatedAt:media.updatedAt}}
