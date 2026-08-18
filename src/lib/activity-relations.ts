import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { activityCategories, categories } from "@/db/schema";

export function idList(value: unknown) { if (Array.isArray(value)) return [...new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0))]; if (typeof value !== "string" || !value) return []; try { return idList(JSON.parse(value)); } catch { return value.split(",").map(item => item.trim()).filter(Boolean); } }
export async function replaceActivityCategories(activityId: string, categoryIds: string[]) { await db.transaction(async tx => { await tx.delete(activityCategories).where(eq(activityCategories.activityId, activityId)); if (categoryIds.length) await tx.insert(activityCategories).values(categoryIds.map(categoryId => ({ activityId, categoryId }))); }); }
export async function activityCategoryMap(activityIds: string[]) { const result = new Map(activityIds.map(id => [id, [] as string[]])); if (!activityIds.length) return result; const rows = await db.select().from(activityCategories).where(inArray(activityCategories.activityId, activityIds)); rows.forEach(row => result.get(row.activityId)?.push(row.categoryId)); return result; }
export async function activityCategoryOptions() { return db.select({ id: categories.id, label: categories.name, color: categories.color, badge: categories.badge }).from(categories).where(eq(categories.scope, "ACTIVITY")).orderBy(asc(categories.sortOrder), asc(categories.name)); }
