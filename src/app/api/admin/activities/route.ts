import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { auth } from "@/auth";
import { db } from "@/db";
import { activities, media } from "@/db/schema";
import { activityCategoryMap, activityCategoryOptions } from "@/lib/activity-relations";

export async function GET() {
  if ((await auth())?.user.role !== "ADMIN") return Response.json({ message: "Non autorisé." }, { status: 401 });
  const pdf = alias(media, "activity_admin_pdf");
  const preview = alias(media, "activity_admin_preview");
  const items = await db.select({ activity: activities, pdf, preview }).from(activities)
    .leftJoin(pdf, eq(activities.pdfMediaId, pdf.id))
    .leftJoin(preview, eq(activities.previewMediaId, preview.id))
    .orderBy(desc(activities.updatedAt));
  const [categoryMap, categoryOptions] = await Promise.all([activityCategoryMap(items.map(item => item.activity.id)), activityCategoryOptions()]);
  return Response.json({ items: items.map(item => ({ ...item, categoryIds: categoryMap.get(item.activity.id) || [] })), categoryOptions });
}
