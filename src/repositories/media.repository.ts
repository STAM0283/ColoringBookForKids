import {and,asc,desc,eq,ilike,inArray,or,sql} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { categories,characters,media,mediaCategories,mediaCharacters,vlogs } from "@/db/schema";

export const mediaRepository = {
  async paginatedImages(options:{page?:number;pageSize?:number;search?:string;category?:string;character?:string;sort?:"newest"|"oldest";includeClub?:boolean;language?:"FR"|"EN"}={}) {
    const page=Math.max(1,options.page??1),pageSize=Math.min(48,Math.max(1,options.pageSize??12)),language=options.language??"FR",search=options.search?.trim(),pattern=search?`%${escapeLike(search)}%`:undefined;
    const searchFilter=pattern?or(ilike(media.alt,pattern),ilike(media.creativeIdea,pattern),ilike(media.originalName,pattern),ilike(categories.name,pattern),sql`exists (select 1 from ${mediaCharacters} search_mc join ${characters} search_c on search_c.id = search_mc.character_id where search_mc.media_id = ${media.id} and search_c.language = ${language} and search_c.published = true and search_c.name ilike ${pattern} escape '\\')`):undefined;
    const where=and(eq(media.type,"IMAGE"),eq(media.galleryEnabled,true),eq(media.language,language),eq(media.published,true),options.includeClub?undefined:eq(media.accessLevel,"PUBLIC"),searchFilter,options.category?eq(categories.slug,options.category):undefined,options.character?sql`exists (select 1 from ${mediaCharacters} mc join ${characters} c on c.id = mc.character_id where mc.media_id = ${media.id} and c.slug = ${options.character} and c.published = true)`:undefined),dateOrder=options.sort==="oldest"?asc(media.createdAt):desc(media.createdAt);
    const items = await db.select(getImageColumns()).from(media).leftJoin(mediaCategories,eq(media.id,mediaCategories.mediaId)).leftJoin(categories,eq(mediaCategories.categoryId,categories.id)).where(where).orderBy(dateOrder).limit(pageSize).offset((page - 1) * pageSize);
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(media).leftJoin(mediaCategories,eq(media.id,mediaCategories.mediaId)).leftJoin(categories,eq(mediaCategories.categoryId,categories.id)).where(where);
    const links=items.length?await db.select({mediaId:mediaCharacters.mediaId,character:{id:characters.id,name:characters.name,slug:characters.slug,color:characters.color}}).from(mediaCharacters).innerJoin(characters,eq(mediaCharacters.characterId,characters.id)).where(and(inArray(mediaCharacters.mediaId,items.map(item=>item.id)),eq(characters.published,true))):[];
    const total = Number(count); return { items:items.map(item=>({...item,characters:links.filter(link=>link.mediaId===item.id).map(link=>link.character)})), page, pageSize, total, pages: Math.ceil(total / pageSize) };
  },
  async imageCategoryOptions(language:"FR"|"EN"="FR") {
    return db
      .select({ name: categories.name, slug: categories.slug })
      .from(categories)
      .where(and(eq(categories.scope,"ACTIVITY"),eq(categories.language,language)))
      .orderBy(asc(categories.sortOrder), asc(categories.name));
  },
  async characterOptions(language:"FR"|"EN"="FR") { return db.select({name:characters.name,slug:characters.slug,color:characters.color}).from(characters).where(and(eq(characters.language,language),eq(characters.published,true))).orderBy(asc(characters.sortOrder),asc(characters.name)); },
  async paginatedPublishedVideos(options:{page?:number;pageSize?:number;search?:string;category?:string;sort?:"newest"|"oldest";language?:"FR"|"EN"}={}) {
    const page = Math.max(1, options.page??1), pageSize = Math.min(48, Math.max(1, options.pageSize??9));
    const video = alias(media, "published_video");
    const thumbnail = alias(media, "published_video_thumbnail");
    const where=and(eq(vlogs.published,true),eq(vlogs.language,options.language??"FR"),options.search?or(ilike(vlogs.title,`%${options.search}%`),ilike(vlogs.description,`%${options.search}%`)):undefined,options.category?eq(categories.slug,options.category):undefined),dateOrder=options.sort==="oldest"?asc(vlogs.publishedAt):desc(vlogs.publishedAt);
    const items = await db.select({ vlog: vlogs, video, thumbnail }).from(vlogs).leftJoin(video, eq(vlogs.videoMediaId, video.id)).leftJoin(thumbnail, eq(vlogs.thumbnailMediaId, thumbnail.id)).leftJoin(categories,eq(vlogs.categoryId,categories.id)).where(where).orderBy(desc(vlogs.featured), dateOrder).limit(pageSize).offset((page - 1) * pageSize);
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(vlogs).leftJoin(categories,eq(vlogs.categoryId,categories.id)).where(where);
    const total = Number(count); return { items, page, pageSize, total, pages: Math.ceil(total / pageSize) };
  },
  async videoCategoryOptions(language:"FR"|"EN"="FR") {
    return db.select({ name: categories.name, slug: categories.slug }).from(categories).where(and(eq(categories.scope,"ACTIVITY"),eq(categories.language,language))).orderBy(asc(categories.sortOrder),asc(categories.name));
  },
  async listImages(limit = 60) {
    return db.select().from(media).where(and(eq(media.type,"IMAGE"),eq(media.galleryEnabled,true),eq(media.published,true),eq(media.accessLevel,"PUBLIC"))).orderBy(desc(media.createdAt)).limit(limit);
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

function getImageColumns(){return {id:media.id,type:media.type,filename:media.filename,originalName:media.originalName,mimeType:media.mimeType,size:media.size,width:media.width,height:media.height,duration:media.duration,path:media.path,alt:media.alt,creativeIdea:media.creativeIdea,accessLevel:media.accessLevel,createdAt:media.createdAt,updatedAt:media.updatedAt}}
function escapeLike(value:string){return value.replace(/[\\%_]/g,character=>`\\${character}`)}
