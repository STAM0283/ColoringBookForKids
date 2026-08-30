import sharp from "sharp";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { activities, activityGallery, activityTypes, media } from "@/db/schema";
import { storageService } from "@/lib/storage/local-storage";
import { imagesToPdf } from "@/lib/images-to-pdf";
import { idList, replaceActivityCategories } from "@/lib/activity-relations";

const schema = z.object({
  title: z.string().trim().min(2).max(150).optional(),
  language: z.enum(["FR","EN"]).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  published: z.boolean().optional(),
  accessLevel: z.enum(["PUBLIC", "CLUB"]).optional(),
  downloadEnabled: z.boolean().optional(),
  activityTypeId: z.string().nullable().optional(),
}).refine(value => Object.values(value).some(item => item !== undefined));

async function admin(){return (await auth())?.user.role === "ADMIN";}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await admin()) return Response.json({ message: "Non autorisé." }, { status: 401 });
  const { id } = await params;
  const current = await db.query.activities.findFirst({ where: eq(activities.id, id) });
  if (!current) return Response.json({ message: "Activité introuvable." }, { status: 404 });
  const multipart = request.headers.get("content-type")?.includes("multipart/form-data");
  let values: unknown;
  let cover: File | null = null;
  let categoryIds: string[] | null = null;
  let multipartForm:FormData|null=null;
  let removedModelIds:string[]=[];
  let removeCover=false;
  if (multipart) {
    const form = await request.formData();
    multipartForm=form;
    const selected = form.get("cover");
    cover = selected instanceof File && selected.size ? selected : null;
    categoryIds = idList(form.get("categoryIds"));
    removedModelIds=idList(form.get("removedModelIds"));
    removeCover=form.get("removeCover")==="true";
    values = { title: form.get("title"), description: form.get("description"), activityTypeId:String(form.get("activityTypeId")||"")||null, accessLevel: form.get("accessLevel"), published: form.get("published") === "true", downloadEnabled: form.get("downloadEnabled") === "true" };
  } else values = await request.json().catch(() => null);
  const parsed = schema.safeParse(values);
  if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message || "Données invalides." }, { status: 400 });
  if (parsed.data.activityTypeId) {
    const expectedLanguage = parsed.data.language || current.language;
    const [validType] = await db.select({ id: activityTypes.id }).from(activityTypes).where(and(eq(activityTypes.id, parsed.data.activityTypeId), eq(activityTypes.language, expectedLanguage))).limit(1);
    if (!validType) return Response.json({ message: "Le type d’activité ne correspond pas à la langue de l’activité." }, { status: 400 });
  }
  const galleryPages=multipartForm?await db.select().from(activityGallery).where(eq(activityGallery.activityId,id)):[];
  const removedPages=galleryPages.filter(page=>multipartForm?.get(`remove-page-${page.id}`)==="true");
  if(removedPages.length&&removedPages.length===galleryPages.length)return Response.json({message:"Une activité doit conserver au moins un dessin."},{status:400});

  let previewMediaId = current.previewMediaId;
  let previousPreview: typeof media.$inferSelect | undefined;
  if(removeCover&&!cover&&current.previewMediaId){previousPreview=await db.query.media.findFirst({where:eq(media.id,current.previewMediaId)});previewMediaId=null}
  if (cover) {
    previousPreview = current.previewMediaId ? await db.query.media.findFirst({ where: eq(media.id, current.previewMediaId) }) : undefined;
    await storageService.validateFile(cover, "IMAGE");
    const meta = await sharp(Buffer.from(await cover.arrayBuffer())).metadata();
    const stored = await storageService.uploadFile(cover, "IMAGE");
    previewMediaId = crypto.randomUUID();
    await db.insert(media).values({ id: previewMediaId, type: "IMAGE", filename: stored.filename, originalName: cover.name, mimeType: stored.mimeType, size: stored.size, width: meta.width, height: meta.height, path: stored.path, alt: `Couverture de ${parsed.data.title || current.title}` });
  }
  await db.update(activities).set({ ...parsed.data, previewMediaId, ...(parsed.data.published !== undefined ? { publishedAt: parsed.data.published ? (current.publishedAt || new Date()) : null } : {}), updatedAt: new Date() }).where(eq(activities.id, id));
  if (categoryIds) await replaceActivityCategories(id, categoryIds);
  if(multipartForm){
    for(const page of galleryPages){
      if(removedPages.some(removed=>removed.id===page.id))continue;
      const selected=multipartForm.get(`model-${page.id}`),removeModel=removedModelIds.includes(page.id)||multipartForm.get(`remove-model-${page.id}`)==="true";
      if(!(selected instanceof File&&selected.size)&&!removeModel)continue;
      const previousModel=page.modelMediaId?await db.query.media.findFirst({where:eq(media.id,page.modelMediaId)}):undefined;
      let modelMediaId:string|null=removeModel?null:page.modelMediaId;
      if(selected instanceof File&&selected.size){await storageService.validateFile(selected,"IMAGE");const meta=await sharp(Buffer.from(await selected.arrayBuffer())).metadata(),stored=await storageService.uploadFile(selected,"IMAGE");modelMediaId=crypto.randomUUID();await db.insert(media).values({id:modelMediaId,type:"IMAGE",filename:stored.filename,originalName:selected.name,mimeType:stored.mimeType,size:stored.size,width:meta.width,height:meta.height,path:stored.path,alt:`Modèle de ${parsed.data.title||current.title}`,language:current.language})}
      await db.update(activityGallery).set({modelMediaId}).where(eq(activityGallery.id,page.id));
      if(previousModel&&previousModel.id!==modelMediaId){await db.delete(media).where(eq(media.id,previousModel.id));await storageService.deleteFile(previousModel.path).catch(()=>undefined)}
    }
  }
  if(removedPages.length){
    const removedIds=new Set(removedPages.map(page=>page.id)),remaining=galleryPages.filter(page=>!removedIds.has(page.id));
    const pageMedia=await db.select().from(media).where(inArray(media.id,remaining.map(page=>page.mediaId))),mediaById=new Map(pageMedia.map(item=>[item.id,item]));
    const root=path.resolve(/*turbopackIgnore: true*/ process.env.MEDIA_ROOT??"./data/media");
    const files:File[]=[];for(const page of remaining){const item=mediaById.get(page.mediaId);if(!item)continue;const buffer=await readFile(safeMediaPath(root,item.path));files.push(new File([new Uint8Array(buffer)],item.originalName,{type:item.mimeType}))}
    if(files.length!==remaining.length)return Response.json({message:"Une page de l’activité est introuvable."},{status:400});
    const pdfBuffer=await imagesToPdf(files),filename=`activite-${id.slice(0,8)}.pdf`,pdfFile=new File([new Uint8Array(pdfBuffer)],filename,{type:"application/pdf"}),storedPdf=await storageService.uploadFile(pdfFile,"PDF"),newPdfId=crypto.randomUUID();
    await db.insert(media).values({id:newPdfId,type:"PDF",filename:storedPdf.filename,originalName:filename,mimeType:"application/pdf",size:storedPdf.size,path:storedPdf.path,alt:parsed.data.title||current.title});
    const removedMediaIds=[...new Set(removedPages.flatMap(page=>[page.mediaId,page.modelMediaId]).filter((value):value is string=>Boolean(value)))];
    const removedMedia=removedMediaIds.length?await db.select().from(media).where(inArray(media.id,removedMediaIds)):[],previousPdf=current.pdfMediaId?await db.query.media.findFirst({where:eq(media.id,current.pdfMediaId)}):undefined;
    await db.delete(activityGallery).where(inArray(activityGallery.id,removedPages.map(page=>page.id)));
    await Promise.all(remaining.map((page,sortOrder)=>db.update(activityGallery).set({sortOrder}).where(eq(activityGallery.id,page.id))));
    const nextPreview=removedPages.some(page=>page.mediaId===previewMediaId)?null:previewMediaId;
    await db.update(activities).set({pdfMediaId:newPdfId,pageCount:remaining.length,previewMediaId:nextPreview,updatedAt:new Date()}).where(eq(activities.id,id));
    if(previousPdf){await db.delete(media).where(eq(media.id,previousPdf.id));await storageService.deleteFile(previousPdf.path).catch(()=>undefined)}
    if(removedMediaIds.length){await db.delete(media).where(inArray(media.id,removedMediaIds));await Promise.all(removedMedia.map(item=>storageService.deleteFile(item.path).catch(()=>undefined)))}
  }
  if (previousPreview) {
    const usedAsPage = await db.query.activityGallery.findFirst({ where: eq(activityGallery.mediaId, previousPreview.id) });
    if (!usedAsPage) { await db.delete(media).where(eq(media.id, previousPreview.id)); await storageService.deleteFile(previousPreview.path).catch(() => undefined); }
  }
  revalidateActivityPages();
  return Response.json({ message: "Activité modifiée avec succès." });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await admin()) return Response.json({ message: "Non autorisé." }, { status: 401 });
  const { id } = await params;
  const item = await db.query.activities.findFirst({ where: eq(activities.id, id) });
  if (!item) return Response.json({ message: "Activité introuvable." }, { status: 404 });
  const gallery = await db.select({mediaId:activityGallery.mediaId,modelMediaId:activityGallery.modelMediaId}).from(activityGallery).where(eq(activityGallery.activityId,id));
  const mediaIds = [...new Set([item.previewMediaId, item.pdfMediaId, ...gallery.flatMap(page=>[page.mediaId,page.modelMediaId])].filter((value): value is string => Boolean(value)))];
  const linkedMedia = mediaIds.length ? await db.select().from(media).where(inArray(media.id, mediaIds)) : [];
  await db.delete(activities).where(eq(activities.id, id));
  if (mediaIds.length) await db.delete(media).where(inArray(media.id, mediaIds));
  await Promise.all(linkedMedia.map(item => storageService.deleteFile(item.path).catch(() => undefined)));
  revalidateActivityPages();
  return Response.json({ message: "Activité supprimée avec succès." });
}

function revalidateActivityPages() {
  revalidatePath("/");
  revalidatePath("/activites");
  revalidatePath("/en");
  revalidatePath("/en/activities");
}
function safeMediaPath(root:string,relative:string){const target=path.resolve(root,relative);if(!target.startsWith(root+path.sep))throw new Error("Chemin de média invalide");return target}
