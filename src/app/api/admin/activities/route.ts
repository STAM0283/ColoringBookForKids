import { asc, desc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { auth } from "@/auth";
import { db } from "@/db";
import { activities, activityGallery, activityTypes, media } from "@/db/schema";
import { activityCategoryMap, activityCategoryOptions } from "@/lib/activity-relations";

export async function GET() {
  if ((await auth())?.user.role !== "ADMIN") return Response.json({ message: "Non autorisé." }, { status: 401 });
  const pdf = alias(media, "activity_admin_pdf");
  const preview = alias(media, "activity_admin_preview");
  const items = await db.select({ activity: activities, activityType:activityTypes, pdf, preview }).from(activities)
    .leftJoin(activityTypes,eq(activities.activityTypeId,activityTypes.id))
    .leftJoin(pdf, eq(activities.pdfMediaId, pdf.id))
    .leftJoin(preview, eq(activities.previewMediaId, preview.id))
    .orderBy(desc(activities.updatedAt));
  const activityIds=items.map(item=>item.activity.id),page=alias(media,"activity_admin_page"),model=alias(media,"activity_admin_model");
  const [categoryMap, categoryOptions,typeOptions,pages] = await Promise.all([activityCategoryMap(activityIds), activityCategoryOptions(),db.select().from(activityTypes).orderBy(activityTypes.language,activityTypes.sortOrder,activityTypes.name),activityIds.length?db.select({id:activityGallery.id,activityId:activityGallery.activityId,path:page.path,alt:page.alt,modelMediaId:activityGallery.modelMediaId,modelPath:model.path,modelAlt:model.alt}).from(activityGallery).innerJoin(page,eq(activityGallery.mediaId,page.id)).leftJoin(model,eq(activityGallery.modelMediaId,model.id)).where(inArray(activityGallery.activityId,activityIds)).orderBy(asc(activityGallery.sortOrder)):Promise.resolve([])]);
  const pagesByActivity=new Map<string,typeof pages>();for(const item of pages){const list=pagesByActivity.get(item.activityId)??[];list.push(item);pagesByActivity.set(item.activityId,list)}
  return Response.json({ items: items.map(item => {
    const activityPages = pagesByActivity.get(item.activity.id) || [];
    const firstPage = activityPages[0];
    return {
      ...item,
      displayPreview: item.preview ?? (firstPage ? { path:firstPage.path, alt:firstPage.alt } : null),
      modelCount: activityPages.filter(pageItem => Boolean(pageItem.modelPath)).length,
      categoryIds: categoryMap.get(item.activity.id) || [],
      pages: activityPages,
    };
  }), categoryOptions,typeOptions });
}
